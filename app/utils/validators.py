import re
import uuid
from typing import Any

def validate_version(version: str) -> bool:
    """验证版本格式"""
    if not version or not isinstance(version, str):
        return False
    
    if len(version) > 50:
        return False
    
    # 允许的版本格式：字母数字、点、破折号、下划线
    pattern = r'^[a-zA-Z0-9._-]+$'
    return bool(re.match(pattern, version))

def validate_session_id(session_id: str) -> bool:
    """验证会话ID格式"""
    if not session_id or not isinstance(session_id, str):
        return False
    
    try:
        # 检查URL安全的base64格式
        if len(session_id) < 20 or len(session_id) > 100:
            return False
        
        # 检查字符集
        pattern = r'^[a-zA-Z0-9_-]+$'
        return bool(re.match(pattern, session_id))
    except:
        return False

def validate_feed_name(name: str) -> bool:
    """验证feed名称"""
    if not name or not isinstance(name, str):
        return False
    
    if len(name) > 50 or len(name) < 2:
        return False
    
    # 只允许字母数字、下划线、破折号
    pattern = r'^[a-zA-Z0-9_-]+$'
    return bool(re.match(pattern, name))

def validate_config_file(content: str) -> bool:
    """验证配置文件内容格式"""
    if not content or not isinstance(content, str):
        return False
    
    # 检查文件大小
    if len(content) > 10 * 1024 * 1024:  # 10MB
        return False
    
    lines = content.split('\n')
    
    # 检查行数限制
    if len(lines) > 50000:
        return False
    
    # 基本格式验证
    valid_line_patterns = [
        r'^\s*#.*$',                    # 注释行
        r'^\s*$',                       # 空行
        r'^CONFIG_[A-Z0-9_]+=.*$',      # 配置项
        r'^# CONFIG_[A-Z0-9_]+ is not set$',  # 未设置的配置项
    ]
    
    for line_num, line in enumerate(lines, 1):
        if line_num > 1000:  # 只检查前1000行以提高性能
            break
        
        line = line.strip()
        if not line:
            continue
        
        # 检查是否匹配任何有效模式
        valid = any(re.match(pattern, line) for pattern in valid_line_patterns)
        if not valid:
            # 允许一些宽松的格式
            if '=' in line and not line.startswith('#'):
                continue
            return False
    
    return True

def validate_symbol_name(name: str) -> bool:
    """验证符号名称"""
    if not name or not isinstance(name, str):
        return False
    
    if len(name) > 200:
        return False
    
    # Kconfig符号名称格式
    pattern = r'^[A-Z0-9_]+$'
    return bool(re.match(pattern, name))

def validate_symbol_value(value: Any, symbol_type: str = None) -> bool:
    """验证符号值"""
    if value is None:
        return False
    
    value_str = str(value)
    
    # 基本长度检查
    if len(value_str) > 1000:
        return False
    
    if symbol_type:
        if symbol_type in ['bool', 'tristate']:
            return value_str in ['y', 'n', 'm']
        elif symbol_type == 'int':
            try:
                int(value_str)
                return True
            except ValueError:
                return False
        elif symbol_type == 'hex':
            try:
                int(value_str, 16)
                return True
            except ValueError:
                return False
        elif symbol_type == 'string':
            # 字符串值的基本验证
            return len(value_str) <= 1000
    
    return True

def sanitize_filename(filename: str) -> str:
    """清理文件名"""
    if not filename:
        return 'config'
    
    # 移除路径分隔符和危险字符
    filename = re.sub(r'[/\\:*?"<>|]', '_', filename)
    filename = filename.strip('. ')
    
    # 限制长度
    if len(filename) > 100:
        filename = filename[:100]
    
    return filename or 'config'
