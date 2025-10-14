from flask import Blueprint, request, jsonify, current_app
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis
from ..models.session import SessionManager
from ..services.repository_service import RepositoryService
from ..services.workspace_service import WorkspaceService
from ..services.kconfig_service import KconfigService
from ..utils.security import generate_session_id, rate_limit, validate_git_url
from ..utils.validators import validate_version, validate_session_id

bp = Blueprint('session', __name__, url_prefix='/api/session')

# 初始化限流器
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=lambda: current_app.config['RATE_LIMIT_STORAGE_URL']
)

def get_session_manager():
    """获取会话管理器实例"""
    if not hasattr(current_app, '_session_manager'):
        current_app._session_manager = SessionManager(
            current_app.config['REDIS_URL'],
            current_app.config['SESSION_TTL']
        )
    return current_app._session_manager

def get_repository_service():
    """获取仓库服务实例"""
    if not hasattr(current_app, '_repository_service'):
        current_app._repository_service = RepositoryService(
            current_app.config['OPENWRT_REPOS_DIR'],
            current_app.config['OPENWRT_GIT_URL']
        )
    return current_app._repository_service

def get_workspace_service():
    """获取工作空间服务实例"""
    if not hasattr(current_app, '_workspace_service'):
        current_app._workspace_service = WorkspaceService(
            current_app.config['WORKSPACES_DIR'],
            get_session_manager()
        )
    return current_app._workspace_service

@bp.route('', methods=['POST'])
@rate_limit(max_requests=10, window=3600)  # 每小时最多10个会话
def create_session():
    """创建新的配置会话"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400
        
        version = data.get('version', 'master')
        client_ip = request.remote_addr
        
        # 验证版本格式
        if not validate_version(version):
            return jsonify({'error': 'Invalid version format'}), 400
        
        # 检查IP的会话限制
        session_manager = get_session_manager()
        if session_manager.get_sessions_by_ip(client_ip) >= current_app.config['MAX_SESSIONS_PER_IP']:
            return jsonify({'error': 'Too many sessions for this IP'}), 429
        
        # 生成会话ID
        session_id = generate_session_id()
        
        # 获取仓库
        repo_service = get_repository_service()
        repo_path = repo_service.get_repo_path(version)
        
        # 创建工作空间
        workspace_service = get_workspace_service()
        workspace_path = workspace_service.create_workspace(session_id, repo_path)
        
        # 创建会话记录
        session_data = session_manager.create_session(
            session_id, version, str(workspace_path), client_ip
        )
        
        # 记录日志
        current_app.logger.info(
            f"Session created: {session_id} for IP {client_ip}, version {version}"
        )
        
        return jsonify({
            'session_id': session_id,
            'version': version,
            'status': 'ready'
        })
        
    except Exception as e:
        current_app.logger.error(f"Session creation failed: {e}")
        return jsonify({
            'error': 'Failed to create session',
            'details': str(e) if current_app.debug else 'Internal server error'
        }), 500

@bp.route('/<session_id>', methods=['GET'])
@rate_limit(max_requests=60, window=60)
def get_session(session_id):
    """获取会话信息"""
    if not validate_session_id(session_id):
        return jsonify({'error': 'Invalid session ID'}), 400
    
    session_manager = get_session_manager()
    session_data = session_manager.get_session(session_id)
    
    if not session_data:
        return jsonify({'error': 'Session not found'}), 404
    
    # 获取工作空间统计
    workspace_service = get_workspace_service()
    workspace_size = workspace_service.get_workspace_size(Path(session_data.workspace_path))
    
    return jsonify({
        'session_id': session_data.session_id,
        'version': session_data.version,
        'status': session_data.status,
        'created_at': session_data.created_at,
        'last_accessed': session_data.last_accessed,
        'workspace_size': workspace_size,
        'workspace_size_mb': round(workspace_size / (1024 * 1024), 2)
    })

@bp.route('/<session_id>', methods=['DELETE'])
@rate_limit(max_requests=30, window=60)
def delete_session(session_id):
    """删除会话"""
    if not validate_session_id(session_id):
        return jsonify({'error': 'Invalid session ID'}), 400
    
    session_manager = get_session_manager()
    session_data = session_manager.get_session(session_id)
    
    if not session_data:
        return jsonify({'error': 'Session not found'}), 404
    
    # 删除工作空间
    workspace_service = get_workspace_service()
    workspace_deleted = workspace_service.delete_workspace(session_id)
    
    # 删除会话记录
    session_deleted = session_manager.delete_session(session_id)
    
    current_app.logger.info(f"Session deleted: {session_id}")
    
    return jsonify({
        'message': 'Session deleted successfully',
        'workspace_deleted': workspace_deleted,
        'session_deleted': session_deleted
    })

@bp.route('/<session_id>/tree', methods=['GET'])
@rate_limit(max_requests=30, window=60)
def get_config_tree(session_id):
    """获取配置树"""
    if not validate_session_id(session_id):
        return jsonify({'error': 'Invalid session ID'}), 400
    
    session_manager = get_session_manager()
    session_data = session_manager.get_session(session_id)
    
    if not session_data:
        return jsonify({'error': 'Session not found'}), 404
    
    try:
        kconfig_service = KconfigService(Path(session_data.workspace_path))
        tree = kconfig_service.get_menu_tree()
        
        return jsonify(tree)
        
    except Exception as e:
        current_app.logger.error(f"Failed to get config tree for {session_id}: {e}")
        return jsonify({
            'error': 'Failed to get configuration tree',
            'details': str(e) if current_app.debug else 'Internal server error'
        }), 500

@bp.route('/<session_id>/feeds', methods=['POST'])
@rate_limit(max_requests=5, window=3600)  # 每小时最多5个feed
def add_feed(session_id):
    """添加自定义feed"""
    if not validate_session_id(session_id):
        return jsonify({'error': 'Invalid session ID'}), 400
    
    session_manager = get_session_manager()
    session_data = session_manager.get_session(session_id)
    
    if not session_data:
        return jsonify({'error': 'Session not found'}), 404
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400
        
        feed_name = data.get('name', '').strip()
        feed_uri = data.get('uri', '').strip()
        feed_branch = data.get('branch', '').strip() or None
        
        # 验证输入
        if not feed_name or not feed_uri:
            return jsonify({'error': 'Feed name and URI are required'}), 400
        
        if not validate_git_url(feed_uri):
            return jsonify({'error': 'Invalid or unsafe Git URL'}), 400
        
        if len(feed_name) > 50 or not feed_name.replace('_', '').replace('-', '').isalnum():
            return jsonify({'error': 'Invalid feed name format'}), 400
        
        # 更新会话状态
        session_manager.update_session_status(session_id, 'building')
        
        # 添加feed
        workspace_service = get_workspace_service()
        workspace_service.add_custom_feed(
            Path(session_data.workspace_path),
            feed_name, feed_uri, feed_branch
        )
        
        # 重新加载Kconfig
        kconfig_service = KconfigService(Path(session_data.workspace_path))
        kconfig_service.reload_kconfig()
        
        # 恢复会话状态
        session_manager.update_session_status(session_id, 'active')
        
        current_app.logger.info(f"Feed added to session {session_id}: {feed_name}")
        
        return jsonify({
            'status': 'success',
            'message': f"Feed '{feed_name}' added successfully"
        })
        
    except Exception as e:
        session_manager.update_session_status(session_id, 'error')
        current_app.logger.error(f"Failed to add feed to session {session_id}: {e}")
        return jsonify({
            'error': 'Failed to add feed',
            'details': str(e) if current_app.debug else 'Internal server error'
        }), 500

@bp.route('/stats', methods=['GET'])
@rate_limit(max_requests=10, window=60)
def get_stats():
    """获取系统统计信息（管理员接口）"""
    try:
        workspace_service = get_workspace_service()
        repo_service = get_repository_service()
        
        workspace_stats = workspace_service.get_workspace_stats()
        available_versions = repo_service.list_available_versions()
        
        return jsonify({
            'workspaces': workspace_stats,
            'available_versions': available_versions,
            'version_count': len(available_versions)
        })
        
    except Exception as e:
        current_app.logger.error(f"Failed to get stats: {e}")
        return jsonify({
            'error': 'Failed to get statistics',
            'details': str(e) if current_app.debug else 'Internal server error'
        }), 500
