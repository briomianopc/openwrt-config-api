from flask import Blueprint, request, jsonify, send_file, current_app
from pathlib import Path
import io
from ..models.session import SessionManager
from ..services.kconfig_service import KconfigService
from ..utils.security import rate_limit, hash_file_content
from ..utils.validators import validate_session_id, validate_config_file

bp = Blueprint('config', __name__, url_prefix='/api/session')

def get_session_manager():
    """获取会话管理器实例"""
    if not hasattr(current_app, '_session_manager'):
        current_app._session_manager = SessionManager(
            current_app.config['REDIS_URL'],
            current_app.config['SESSION_TTL']
        )
    return current_app._session_manager

@bp.route('/<session_id>/symbol/<symbol_name>', methods=['PUT'])
@rate_limit(max_requests=200, window=60)
def update_symbol(session_id, symbol_name):
    """更新符号值"""
    if not validate_session_id(session_id):
        return jsonify({'error': 'Invalid session ID'}), 400
    
    session_manager = get_session_manager()
    session_data = session_manager.get_session(session_id)
    
    if not session_data:
        return jsonify({'error': 'Session not found'}), 404
    
    try:
        data = request.get_json()
        if not data or 'value' not in data:
            return jsonify({'error': 'Value is required'}), 400
        
        new_value = str(data['value'])
        
        # 验证符号名称
        if not symbol_name or len(symbol_name) > 200:
            return jsonify({'error': 'Invalid symbol name'}), 400
        
        kconfig_service = KconfigService(Path(session_data.workspace_path))
        result = kconfig_service.update_symbol(symbol_name, new_value)
        
        return jsonify(result)
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Symbol update failed for {session_id}: {e}")
        return jsonify({
            'error': 'Failed to update symbol',
            'details': str(e) if current_app.debug else 'Internal server error'
        }), 500

@bp.route('/<session_id>/config/upload', methods=['POST'])
@rate_limit(max_requests=10, window=3600)
def upload_config(session_id):
    """上传配置文件"""
    if not validate_session_id(session_id):
        return jsonify({'error': 'Invalid session ID'}), 400
    
    session_manager = get_session_manager()
    session_data = session_manager.get_session(session_id)
    
    if not session_data:
        return jsonify({'error': 'Session not found'}), 404
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if not file.filename:
            return jsonify({'error': 'No file selected'}), 400
        
        # 读取文件内容
        file_content = file.read()
        
        # 验证文件大小
        if len(file_content) > current_app.config['MAX_UPLOAD_SIZE']:
            return jsonify({'error': 'File too large'}), 413
        
        # 验证文件内容
        try:
            config_text = file_content.decode('utf-8')
        except UnicodeDecodeError:
            return jsonify({'error': 'File must be UTF-8 encoded'}), 400
        
        if not validate_config_file(config_text):
            return jsonify({'error': 'Invalid configuration file format'}), 400
        
        # 计算文件哈希
        file_hash = hash_file_content(file_content)
        
        # 加载配置
        kconfig_service = KconfigService(Path(session_data.workspace_path))
        tree = kconfig_service.load_config_file(config_text)
        
        current_app.logger.info(f"Config uploaded to session {session_id}, hash: {file_hash}")
        
        return jsonify({
            'message': 'Configuration loaded successfully',
            'file_hash': file_hash,
            'tree': tree
        })
        
    except Exception as e:
        current_app.logger.error(f"Config upload failed for {session_id}: {e}")
        return jsonify({
            'error': 'Failed to load configuration',
            'details': str(e) if current_app.debug else 'Internal server error'
        }), 500

@bp.route('/<session_id>/config/download', methods=['GET'])
@rate_limit(max_requests=30, window=60)
def download_config(session_id):
    """下载完整配置文件"""
    if not validate_session_id(session_id):
        return jsonify({'error': 'Invalid session ID'}), 400
    
    session_manager = get_session_manager()
    session_data = session_manager.get_session(session_id)
    
    if not session_data:
        return jsonify({'error': 'Session not found'}), 404
    
    try:
        kconfig_service = KconfigService(Path(session_data.workspace_path))
        config_content = kconfig_service.save_config('full')
        
        # 创建内存文件
        buffer = io.BytesIO()
        buffer.write(config_content.encode('utf-8'))
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name='.config',
            mimetype='text/plain'
        )
        
    except Exception as e:
        current_app.logger.error(f"Config download failed for {session_id}: {e}")
        return jsonify({
            'error': 'Failed to generate configuration',
            'details': str(e) if current_app.debug else 'Internal server error'
        }), 500

@bp.route('/<session_id>/diffconfig/download', methods=['GET'])
@rate_limit(max_requests=30, window=60)
def download_diffconfig(session_id):
    """下载最小配置文件"""
    if not validate_session_id(session_id):
        return jsonify({'error': 'Invalid session ID'}), 400
    
    session_manager = get_session_manager()
    session_data = session_manager.get_session(session_id)
    
    if not session_data:
        return jsonify({'error': 'Session not found'}), 404
    
    try:
        kconfig_service = KconfigService(Path(session_data.workspace_path))
        config_content = kconfig_service.save_config('minimal')
        
        # 创建内存文件
        buffer = io.BytesIO()
        buffer.write(config_content.encode('utf-8'))
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name='diffconfig',
            mimetype='text/plain'
        )
        
    except Exception as e:
        current_app.logger.error(f"Diffconfig download failed for {session_id}: {e}")
        return jsonify({
            'error': 'Failed to generate minimal configuration',
            'details': str(e) if current_app.debug else 'Internal server error'
        }), 500

@bp.route('/<session_id>/search', methods=['GET'])
@rate_limit(max_requests=60, window=60)
def search_symbols(session_id):
    """搜索符号"""
    if not validate_session_id(session_id):
        return jsonify({'error': 'Invalid session ID'}), 400
    
    
