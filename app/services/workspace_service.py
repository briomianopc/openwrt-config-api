import os
import shutil
import subprocess
import threading
import time
from pathlib import Path
from typing import Optional, Dict, List
from flask import current_app
from ..models.session import SessionManager
from ..utils.security import safe_path_join, sanitize_command_args

class WorkspaceService:
    def __init__(self, workspaces_dir: str, session_manager: SessionManager):
        self.workspaces_dir = Path(workspaces_dir)
        self.session_manager = session_manager
        self.workspaces_dir.mkdir(parents=True, exist_ok=True)
        self._cleanup_running = False
        self._start_cleanup_worker()
    
    def create_workspace(self, session_id: str, source_repo_path: Path) -> Path:
        """创建工作空间"""
        workspace_path = self.workspaces_dir / session_id
        
        if workspace_path.exists():
            current_app.logger.warning(f"Workspace {session_id} already exists, cleaning up")
            shutil.rmtree(workspace_path)
        
        try:
            current_app.logger.info(f"Creating workspace for session {session_id}")
            
            # 使用硬链接复制以节省空间和时间
            self._copy_with_hardlinks(source_repo_path, workspace_path)
            
            # 初始化feeds
            self._initialize_feeds(workspace_path)
            
            current_app.logger.info(f"Workspace created successfully: {workspace_path}")
            return workspace_path
            
        except Exception as e:
            current_app.logger.error(f"Failed to create workspace {session_id}: {e}")
            if workspace_path.exists():
                shutil.rmtree(workspace_path)
            raise
    
    def _copy_with_hardlinks(self, source: Path, dest: Path) -> None:
        """使用硬链接复制文件树（适用于同一文件系统）"""
        try:
            # 首先尝试使用cp -al（Linux）进行硬链接复制
            result = subprocess.run(
                ["cp", "-al", str(source), str(dest)],
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode == 0:
                return
            
        except (subprocess.SubprocessError, FileNotFoundError):
            pass
        
        # 回退到常规复制
        current_app.logger.info("Hard link copy failed, falling back to regular copy")
        shutil.copytree(source, dest, symlinks=True)
    
    def _initialize_feeds(self, workspace_path: Path) -> None:
        """初始化OpenWrt feeds"""
        feeds_script = workspace_path / "scripts" / "feeds"
        
        if not feeds_script.exists():
            raise Exception("feeds script not found in workspace")
        
        try:
            # 更新feeds
            cmd_update = ["./scripts/feeds", "update", "-a"]
            result = subprocess.run(
                sanitize_command_args(cmd_update),
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode != 0:
                raise Exception(f"Feeds update failed: {result.stderr}")
            
            # 安装feeds
            cmd_install = ["./scripts/feeds", "install", "-a"]
            result = subprocess.run(
                sanitize_command_args(cmd_install),
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode != 0:
                raise Exception(f"Feeds install failed: {result.stderr}")
            
        except subprocess.TimeoutExpired:
            raise Exception("Feeds initialization timeout")
    
    def add_custom_feed(self, workspace_path: Path, feed_name: str, 
                       feed_uri: str, feed_branch: Optional[str] = None) -> None:
        """添加自定义feed"""
        feeds_conf = workspace_path / "feeds.conf.default"
        
        if not feeds_conf.exists():
            raise Exception("feeds.conf.default not found")
        
        # 构建feed行
        feed_line = f"src-git {feed_name} {feed_uri}"
        if feed_branch:
            feed_line += f";{feed_branch}"
        
        try:
            # 添加到feeds配置
            with open(feeds_conf, 'a') as f:
                f.write(f"\n{feed_line}\n")
            
            # 更新新feed
            cmd_update = ["./scripts/feeds", "update", feed_name]
            result = subprocess.run(
                sanitize_command_args(cmd_update),
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=180
            )
            
            if result.returncode != 0:
                raise Exception(f"Feed update failed: {result.stderr}")
            
            # 安装新feed的包
            cmd_install = ["./scripts/feeds", "install", "-a", "-p", feed_name]
            result = subprocess.run(
                sanitize_command_args(cmd_install),
                cwd=workspace_path,
                capture_output=True,
                text=True,
                timeout=180
            )
            
            if result.returncode != 0:
                raise Exception(f"Feed install failed: {result.stderr}")
            
        except subprocess.TimeoutExpired:
            raise Exception("Feed processing timeout")
    
    def get_workspace_size(self, workspace_path: Path) -> int:
        """获取工作空间大小"""
        total_size = 0
        try:
            for dirpath, dirnames, filenames in os.walk(workspace_path):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    try:
                        total_size += os.path.getsize(filepath)
                    except (OSError, IOError):
                        # 跳过无法访问的文件
                        continue
        except Exception as e:
            current_app.logger.error(f"Error calculating workspace size: {e}")
        
        return total_size
    
    def delete_workspace(self, session_id: str) -> bool:
        """删除工作空间"""
        workspace_path = self.workspaces_dir / session_id
        
        if not workspace_path.exists():
            return True
        
        try:
            shutil.rmtree(workspace_path)
            current_app.logger.info(f"Deleted workspace: {workspace_path}")
            return True
        except Exception as e:
            current_app.logger.error(f"Failed to delete workspace {workspace_path}: {e}")
            return False
    
    def _start_cleanup_worker(self):
        """启动清理工作线程"""
        if self._cleanup_running:
            return
        
        self._cleanup_running = True
        cleanup_thread = threading.Thread(target=self._cleanup_worker, daemon=True)
        cleanup_thread.start()
        current_app.logger.info("Workspace cleanup worker started")
    
    def _cleanup_worker(self):
        """清理工作线程"""
        while self._cleanup_running:
            try:
                self._cleanup_expired_workspaces()
                time.sleep(current_app.config.get('CLEANUP_INTERVAL', 300))
            except Exception as e:
                current_app.logger.error(f"Cleanup worker error: {e}")
                time.sleep(60)  # 发生错误时等待1分钟再重试
    
    def _cleanup_expired_workspaces(self):
        """清理过期工作空间"""
        current_app.logger.debug("Starting workspace cleanup")
        cleaned_count = 0
        
        # 首先清理Redis中的过期会话
        expired_sessions = self.session_manager.cleanup_expired_sessions()
        
        # 然后清理孤立的工作空间目录
        for workspace_dir in self.workspaces_dir.iterdir():
            if not workspace_dir.is_dir():
                continue
            
            session_id = workspace_dir.name
            session_data = self.session_manager.get_session(session_id)
            
            if not session_data:
                # 会话不存在，删除工作空间
                if self.delete_workspace(session_id):
                    cleaned_count += 1
        
        if cleaned_count > 0 or expired_sessions > 0:
            current_app.logger.info(
                f"Cleanup completed: {expired_sessions} expired sessions, "
                f"{cleaned_count} orphaned workspaces"
            )
    
    def get_workspace_stats(self) -> Dict:
        """获取工作空间统计信息"""
        total_workspaces = 0
        total_size = 0
        
        try:
            for workspace_dir in self.workspaces_dir.iterdir():
                if workspace_dir.is_dir():
                    total_workspaces += 1
                    total_size += self.get_workspace_size(workspace_dir)
        
        except Exception as e:
            current_app.logger.error(f"Error getting workspace stats: {e}")
        
        return {
            'total_workspaces': total_workspaces,
            'total_size': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2)
        }
