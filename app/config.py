import os
import secrets

class Config:
    """基础配置类"""
    
    # Flask配置
    SECRET_KEY = os.getenv('SECRET_KEY', secrets.token_urlsafe(32))
    DEBUG = False
    TESTING = False
    
    # 数据库配置
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    
    # OpenWrt配置
    OPENWRT_REPOS_DIR = os.getenv('OPENWRT_REPOS_DIR', './data/repos')
    WORKSPACES_DIR = os.getenv('WORKSPACES_DIR', './data/workspaces')
    OPENWRT_GIT_URL = os.getenv('OPENWRT_GIT_URL', 'https://github.com/openwrt/openwrt.git')
    
    # 会话配置
    SESSION_TTL = int(os.getenv('SESSION_TTL', '3600'))  # 1小时
    MAX_SESSIONS_PER_IP = int(os.getenv('MAX_SESSIONS_PER_IP', '5'))
    
    # 资源限制
    MAX_WORKSPACE_SIZE = int(os.getenv('MAX_WORKSPACE_SIZE', '2147483648'))  # 2GB
    MAX_UPLOAD_SIZE = int(os.getenv('MAX_UPLOAD_SIZE', '10485760'))  # 10MB
    CLEANUP_INTERVAL = int(os.getenv('CLEANUP_INTERVAL', '300'))  # 5分钟
    
    # 安全配置
    ALLOWED_EXTENSIONS = {'config', 'txt'}
    MAX_SEARCH_RESULTS = int(os.getenv('MAX_SEARCH_RESULTS', '100'))
    
    # 速率限制配置 - 使用环境变量或默认到 REDIS_URL
    @property
    def RATE_LIMIT_STORAGE_URL(self):
        return os.getenv('RATE_LIMIT_STORAGE_URL', self.REDIS_URL)
    
    # Celery配置
    @property
    def CELERY_BROKER_URL(self):
        return os.getenv('CELERY_BROKER_URL', self.REDIS_URL)
    
    @property
    def CELERY_RESULT_BACKEND(self):
        return os.getenv('CELERY_RESULT_BACKEND', self.REDIS_URL)
    
    # 日志配置
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE')

class ProductionConfig(Config):
    DEBUG = False
    
class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    DEBUG = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
