import json
import time
from typing import Optional, Dict, Any
from dataclasses import dataclass, asdict
import redis
from flask import current_app

@dataclass
class SessionData:
    session_id: str
    version: str
    workspace_path: str
    created_at: float
    last_accessed: float
    client_ip: str
    status: str = 'active'  # active, building, error, expired
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SessionData':
        return cls(**data)

class SessionManager:
    def __init__(self, redis_url: str, ttl: int = 3600):
        self.redis_client = redis.from_url(redis_url)
        self.ttl = ttl
        self.session_prefix = "session:"
        self.ip_sessions_prefix = "ip_sessions:"
    
    def create_session(self, session_id: str, version: str, workspace_path: str, 
                      client_ip: str) -> SessionData:
        """创建新会话"""
        now = time.time()
        session_data = SessionData(
            session_id=session_id,
            version=version,
            workspace_path=workspace_path,
            created_at=now,
            last_accessed=now,
            client_ip=client_ip
        )
        
        # 存储会话数据
        session_key = f"{self.session_prefix}{session_id}"
        self.redis_client.setex(
            session_key,
            self.ttl,
            json.dumps(session_data.to_dict())
        )
        
        # 跟踪IP的会话数
        ip_key = f"{self.ip_sessions_prefix}{client_ip}"
        self.redis_client.sadd(ip_key, session_id)
        self.redis_client.expire(ip_key, self.ttl)
        
        return session_data
    
    def get_session(self, session_id: str) -> Optional[SessionData]:
        """获取会话数据"""
        session_key = f"{self.session_prefix}{session_id}"
        data = self.redis_client.get(session_key)
        
        if not data:
            return None
        
        try:
            session_data = SessionData.from_dict(json.loads(data))
            # 更新最后访问时间
            session_data.last_accessed = time.time()
            self.redis_client.setex(
                session_key,
                self.ttl,
                json.dumps(session_data.to_dict())
            )
            return session_data
        except (json.JSONDecodeError, TypeError, KeyError) as e:
            current_app.logger.error(f"Session data corruption for {session_id}: {e}")
            self.delete_session(session_id)
            return None
    
    def update_session_status(self, session_id: str, status: str) -> bool:
        """更新会话状态"""
        session_data = self.get_session(session_id)
        if not session_data:
            return False
        
        session_data.status = status
        session_key = f"{self.session_prefix}{session_id}"
        self.redis_client.setex(
            session_key,
            self.ttl,
            json.dumps(session_data.to_dict())
        )
        return True
    
    def delete_session(self, session_id: str) -> bool:
        """删除会话"""
        session_key = f"{self.session_prefix}{session_id}"
        result = self.redis_client.delete(session_key)
        
        # 从IP会话集合中移除
        # 注意：这里需要遍历所有IP键，效率不高，在生产中可能需要优化
        for key in self.redis_client.scan_iter(f"{self.ip_sessions_prefix}*"):
            self.redis_client.srem(key, session_id)
        
        return bool(result)
    
    def get_sessions_by_ip(self, client_ip: str) -> int:
        """获取指定IP的会话数量"""
        ip_key = f"{self.ip_sessions_prefix}{client_ip}"
        return self.redis_client.scard(ip_key)
    
    def cleanup_expired_sessions(self) -> int:
        """清理过期会话（通常由后台任务调用）"""
        count = 0
        current_time = time.time()
        
        for key in self.redis_client.scan_iter(f"{self.session_prefix}*"):
            data = self.redis_client.get(key)
            if data:
                try:
                    session_data = SessionData.from_dict(json.loads(data))
                    if current_time - session_data.last_accessed > self.ttl:
                        session_id = session_data.session_id
                        self.delete_session(session_id)
                        count += 1
                except (json.JSONDecodeError, TypeError, KeyError):
                    # 损坏的数据，直接删除
                    self.redis_client.delete(key)
                    count += 1
        
        return count
