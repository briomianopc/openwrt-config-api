import os
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.exceptions import HTTPException
import redis
from .config import config

def create_app(config_name=None):
    """应用工厂函数"""
    app = Flask(__name__)
    
    # 加载配置
    config_name = config_name or os.getenv('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])
    
    # 设置启动时间
    app.config['START_TIME'] = datetime.utcnow().isoformat() + 'Z'
    
    # 设置日志
    setup_logging(app)
    
    # 初始化扩展
    setup_extensions(app)
    
    # 注册蓝图
    register_blueprints(app)
    
    # 设置错误处理
    setup_error_handlers(app)
    
    # 创建必要目录
    setup_directories(app)
    
    # 注册健康检查端点
    register_health_check(app)
    
    return app

def setup_logging(app):
    """设置日志"""
    if not app.debug and not app.testing:
        # 设置日志级别
        log_level = getattr(logging, app.config['LOG_LEVEL'].upper(), logging.INFO)
        app.logger.setLevel(log_level)
        
        # 文件处理器
        if app.config.get('LOG_FILE'):
            file_handler = RotatingFileHandler(
                app.config['LOG_FILE'],
                maxBytes=10485760,  # 10MB
                backupCount=10
            )
            file_handler.setFormatter(logging.Formatter(
                '%(asctime)s %(levelname)s: %(message)s '
                '[in %(pathname)s:%(lineno)d]'
            ))
            file_handler.setLevel(log_level)
            app.logger.addHandler(file_handler)
        
        # 控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s'
        ))
        console_handler.setLevel(log_level)
        app.logger.addHandler(console_handler)
        
        app.logger.info('OpenWrt Config API startup')

def setup_extensions(app):
    """初始化扩展"""
    # CORS配置 - 根据环境动态设置
    allowed_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost').split(',')
    
    CORS(app, resources={
        r"/api/*": {
            "origins": allowed_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Disposition"]
        }
    })
    
    # 速率限制
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["200 per hour", "50 per minute"],
        storage_uri=app.config['RATE_LIMIT_STORAGE_URL']
    )
    limiter.init_app(app)
    
    # 测试Redis连接
    try:
        redis_client = redis.from_url(app.config['REDIS_URL'])
        redis_client.ping()
        app.logger.info("Redis connection successful")
    except Exception as e:
        app.logger.error(f"Redis connection failed: {e}")
        if not app.testing:
            raise

def register_blueprints(app):
    """注册蓝图"""
    from .api.session import bp as session_bp
    from .api.config import bp as config_bp
    
    app.register_blueprint(session_bp)
    app.register_blueprint(config_bp)

def setup_error_handlers(app):
    """设置错误处理"""
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """处理HTTP异常"""
        return jsonify({
            'error': e.name,
            'message': e.description,
            'status_code': e.code
        }), e.code
    
    @app.errorhandler(429)
    def handle_rate_limit(e):
        """处理速率限制"""
        return jsonify({
            'error': 'Rate limit exceeded',
            'message': 'Too many requests. Please slow down.',
            'retry_after': getattr(e, 'retry_after', 60)
        }), 429
    
    @app.errorhandler(Exception)
    def handle_general_exception(e):
        """处理一般异常"""
        app.logger.error(f'Unhandled exception: {e}', exc_info=True)
        
        if app.debug:
            return jsonify({
                'error': 'Internal Server Error',
                'message': str(e),
                'type': type(e).__name__
            }), 500
        else:
            return jsonify({
                'error': 'Internal Server Error',
                'message': 'An unexpected error occurred'
            }), 500
    
    @app.before_request
    def log_request_info():
        """记录请求信息"""
        if not app.debug:
            app.logger.info(
                f'{request.remote_addr} - {request.method} {request.url} - '
                f'User-Agent: {request.headers.get("User-Agent", "Unknown")}'
            )
    
    @app.after_request
    def log_response_info(response):
        """记录响应信息"""
        if not app.debug and response.status_code >= 400:
            app.logger.warning(
                f'Response {response.status_code} for '
                f'{request.method} {request.url}'
            )
        return response

def setup_directories(app):
    """创建必要目录"""
    directories = [
        app.config['OPENWRT_REPOS_DIR'],
        app.config['WORKSPACES_DIR']
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        app.logger.info(f'Directory ensured: {directory}')

# 健康检查端点
def register_health_check(app):
    """注册健康检查端点"""
    
    @app.route('/health')
    def health_check():
        """健康检查"""
        try:
            # 检查Redis连接
            redis_client = redis.from_url(app.config['REDIS_URL'])
            redis_client.ping()
            redis_status = 'ok'
        except Exception as e:
            redis_status = f'error: {str(e)}'
        
        # 检查目录
        dirs_status = {}
        for name, path in [
            ('repos', app.config['OPENWRT_REPOS_DIR']),
            ('workspaces', app.config['WORKSPACES_DIR'])
        ]:
            dirs_status[name] = 'ok' if os.path.exists(path) and os.access(path, os.W_OK) else 'error'
        
        overall_status = 'healthy' if (
            redis_status == 'ok' and 
            all(status == 'ok' for status in dirs_status.values())
        ) else 'unhealthy'
        
        return jsonify({
            'status': overall_status,
            'timestamp': app.config.get('START_TIME', 'unknown'),
            'version': '1.0.0',
            'checks': {
                'redis': redis_status,
                'directories': dirs_status
            }
        }), 200 if overall_status == 'healthy' else 503
