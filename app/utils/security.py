import os
import re
import hashlib
import secrets
from pathlib import Path
from typing import Union, Optional
from werkzeug.utils import secure_filename
from functools import wraps
from flask import request, jsonify, current_app
import redis

class SecurityError(Exception):
    pass

class PathTraversalError(SecurityError):
    pass

def safe_path_join(base_path: Union[str, Path], *paths: str) -> Path:
    """安全的路径拼接，防止路径遍历攻击"""
    base = Path(base_path).resolve()
    target = base
    
    for path in paths:
        # 清理路径组件
        clean_path = secure_filename(path) if path else ''
        if not clean_path:
            raise PathTraversalError("Invalid path component")
        target = target / clean_path
    
    # 确保最终路径在基础路径内
    try:
        target.resolve().relative_to(base)
    except ValueError:
        raise PathTraversalError("Path traversal detected")
    
    return target

def validate_git_url(url: str) -> bool:
    """验证Git URL的安全性"""
    # 只允许https和git协议
    if not re.match(r'^(https?|git)://', url):
        return False
    
    # 不允许本地文件系统路径
    if 'file://' in url or url.startswith('/'):
        return False
    
    # 基本的URL格式验证
    if not re.match(r'^https?://[\w\-\.]+/[\w\-\./]+(?:\.git)?(?:\?.*)?$', url):
        return False
    
    return True

def sanitize_command_args(args: list) -> list:
    """清理命令行参数，防止注入攻击"""
    sanitized = []
    for arg in args:
        # 移除危险字符
        clean_arg = re.sub(r'[;&|`$(){}[\]<>]', '', str(arg))
        if clean_arg != arg:
            raise SecurityError(f"Dangerous characters in argument: {arg}")
        sanitized.append(clean_arg)
    return sanitized

def generate_session_id() -> str:
    """生成安全的会话ID"""
    return secrets.token_urlsafe(32)

def hash_file_content(content: bytes) -> str:
    """生成文件内容的哈希值"""
    return hashlib.sha256(content).hexdigest()

# 速率限制装饰器
def rate_limit(max_requests: int = 60, window: int = 60, key_func=None):
    """速率限制装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if current_app.testing:
                return f(*args, **kwargs)
            
            try:
                redis_client = redis.from_url(current_app.config['RATE_LIMIT_STORAGE_URL'])
                
                # 确定限制键
                if key_func:
                    key = key_func()
                else:
                    key = f"rate_limit:{request.remote_addr}:{request.endpoint}"
                
                # 检查当前请求数
                current_requests = redis_client.get(key)
                if current_requests is None:
                    redis_client.setex(key, window, 1)
                else:
                    current_requests = int(current_requests)
                    if current_requests >= max_requests:
                        return jsonify({
                            'error': 'Rate limit exceeded',
                            'retry_after': redis_client.ttl(key)
                        }), 429
                    redis_client.incr(key)
                
                return f(*args, **kwargs)
            except Exception as e:
                current_app.logger.error(f"Rate limiting error: {e}")
                # 如果速率限制失败，允许请求通过但记录错误
                return f(*args, **kwargs)
        
        return decorated_function
    return decorator
