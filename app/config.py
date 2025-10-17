import os
import secrets
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Config:
    # Flask配置
    SECRET_KEY: str = os.getenv('SECRET_KEY', secrets.token_urlsafe(32))
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # 数据库配置
    REDIS_URL: str = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    DATABASE_URL: str = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    
    # OpenWrt配置
    OPENWRT_REPOS_DIR: str = os.getenv('OPENWRT_REPOS_DIR', './data/repos')
    WORKSPACES_DIR: str = os.getenv('WORKSPACES_DIR', './data/workspaces')
    OPENWRT_GIT_URL: str = os.getenv('OPENWRT_GIT_URL', 'https://github.com/openwrt/openwrt.git')
    
    # 会话配置
    SESSION_TTL: int = int(os.getenv('SESSION_TTL', '3600'))  # 1小时
    MAX_SESSIONS_PER_IP: int = int(os.getenv('MAX_SESSIONS_PER_IP', '5'))
    
    # 资源限制
    MAX_WORKSPACE_SIZE: int = int(os.getenv('MAX_WORKSPACE_SIZE', '2147483648'))  # 2GB
    MAX_UPLOAD_SIZE: int = int(os.getenv('MAX_UPLOAD_SIZE', '10485760'))  # 10MB
    CLEANUP_INTERVAL: int = int(os.getenv('CLEANUP_INTERVAL', '300'))  # 5分钟
    
    # 安全配置
    ALLOWED_EXTENSIONS: set = field(default_factory=lambda: {'config', 'txt'})
    MAX_SEARCH_RESULTS: int = int(os.getenv('MAX_SEARCH_RESULTS', '100'))
    
    # 日志配置
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE: Optional[str] = os.getenv('LOG_FILE')
    
    def __post_init__(self):
        """在初始化后设置依赖其他配置的值"""
        # 速率限制配置 - 如果未设置则使用 REDIS_URL
        if not hasattr(self, 'RATE_LIMIT_STORAGE_URL'):
            self.RATE_LIMIT_STORAGE_URL = os.getenv('RATE_LIMIT_STORAGE_URL', self.REDIS_URL)
        
        # Celery配置 - 如果未设置则使用 REDIS_URL
        if not hasattr(self, 'CELERY_BROKER_URL'):
            self.CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', self.REDIS_URL)
        
        if not hasattr(self, 'CELERY_RESULT_BACKEND'):
            self.CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', self.REDIS_URL)

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
