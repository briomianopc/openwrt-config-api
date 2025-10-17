import os
import subprocess
import threading
import time
from pathlib import Path
from typing import Dict, Optional
from flask import current_app
from ..utils.security import sanitize_command_args, validate_git_url

class RepositoryService:
    def __init__(self, repos_dir: str, git_url: str):
        self.repos_dir = Path(repos_dir)
        self.git_url = git_url
        self.repos_dir.mkdir(parents=True, exist_ok=True)
        self._clone_locks: Dict[str, threading.Lock] = {}
        self._lock_manager_lock = threading.Lock()
    
    def _get_clone_lock(self, version: str) -> threading.Lock:
        """获取版本特定的克隆锁"""
        with self._lock_manager_lock:
            if version not in self._clone_locks:
                self._clone_locks[version] = threading.Lock()
            return self._clone_locks[version]
    
    def get_repo_path(self, version: str = "master") -> Path:
        """获取仓库路径，如果不存在则克隆"""
        # 验证版本名称安全性
        if not version.replace('-', '').replace('.', '').replace('_', '').isalnum():
            raise ValueError(f"Invalid version format: {version}")
        
        repo_path = self.repos_dir / version
        
        if repo_path.exists() and self._validate_repo(repo_path):
            return repo_path
        
        # 使用版本特定的锁防止重复克隆
        clone_lock = self._get_clone_lock(version)
        with clone_lock:
            # 双重检查
            if repo_path.exists() and self._validate_repo(repo_path):
                return repo_path
            
            return self._clone_repository(version, repo_path)
    
    def _validate_repo(self, repo_path: Path) -> bool:
        """验证仓库完整性"""
        try:
            git_dir = repo_path / ".git"
            if not git_dir.exists():
                return False
            
            # 检查是否是有效的git仓库
            result = subprocess.run(
                ["git", "rev-parse", "--git-dir"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0
        except Exception as e:
            current_app.logger.warning(f"Repo validation failed for {repo_path}: {e}")
            return False
    
    def _clone_repository(self, version: str, repo_path: Path) -> Path:
        """克隆仓库"""
        current_app.logger.info(f"Cloning OpenWrt version '{version}' to {repo_path}")
        
        # 清理可能存在的不完整目录
        if repo_path.exists():
            import shutil
            shutil.rmtree(repo_path)
        
        try:
            # 构建安全的git命令
            # 对于master版本，尝试master和main分支
            branch = version
            cmd = [
                "git", "clone",
                "--depth", "1",
                "--single-branch",
                "--branch", branch,
                self.git_url,
                str(repo_path)
            ]
            
            # 清理命令参数
            cmd = sanitize_command_args(cmd)
            
            # 执行克隆
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600,  # 10分钟超时
                check=True
            )
            
            current_app.logger.info(f"Successfully cloned '{version}'")
            return repo_path
        
        except subprocess.CalledProcessError as e:
            # 如果是master分支失败，尝试main分支
            if version == "master" and "Remote branch master not found" in str(e.stderr):
                current_app.logger.info("Master branch not found, trying main branch")
                try:
                    cmd = [
                        "git", "clone",
                        "--depth", "1",
                        "--single-branch",
                        "--branch", "main",
                        self.git_url,
                        str(repo_path)
                    ]
                    cmd = sanitize_command_args(cmd)
                    subprocess.run(cmd, capture_output=True, text=True, timeout=600, check=True)
                    current_app.logger.info(f"Successfully cloned using main branch")
                    return repo_path
                except Exception:
                    pass
            raise
            
        except subprocess.TimeoutExpired:
            current_app.logger.error(f"Timeout cloning version '{version}'")
            if repo_path.exists():
                import shutil
                shutil.rmtree(repo_path)
            raise Exception("Repository clone timeout")
        
        except subprocess.CalledProcessError as e:
            current_app.logger.error(f"Failed to clone version '{version}': {e.stderr}")
            if repo_path.exists():
                import shutil
                shutil.rmtree(repo_path)
            raise Exception(f"Repository clone failed: {e.stderr}")
    
    def update_repository(self, version: str = "master") -> bool:
        """更新已存在的仓库"""
        repo_path = self.repos_dir / version
        
        if not repo_path.exists():
            current_app.logger.warning(f"Repository {version} does not exist, cannot update")
            return False
        
        clone_lock = self._get_clone_lock(version)
        with clone_lock:
            try:
                # 获取当前分支名
                result = subprocess.run(
                    ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                    cwd=repo_path,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                current_branch = result.stdout.strip() if result.returncode == 0 else version
                
                cmd = ["git", "pull", "origin", current_branch]
                cmd = sanitize_command_args(cmd)
                
                result = subprocess.run(
                    cmd,
                    cwd=repo_path,
                    capture_output=True,
                    text=True,
                    timeout=300,
                    check=True
                )
                
                current_app.logger.info(f"Successfully updated repository '{version}'")
                return True
                
            except Exception as e:
                current_app.logger.error(f"Failed to update repository '{version}': {e}")
                return False
    
    def list_available_versions(self) -> list:
        """列出本地可用版本"""
        versions = []
        for item in self.repos_dir.iterdir():
            if item.is_dir() and self._validate_repo(item):
                versions.append(item.name)
        return sorted(versions)
    
    def get_repo_info(self, version: str = "master") -> Optional[Dict]:
        """获取仓库信息"""
        repo_path = self.get_repo_path(version)
        
        try:
            # 获取最新提交信息
            result = subprocess.run(
                ["git", "log", "-1", "--format=%H|%an|%ad|%s"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                parts = result.stdout.strip().split('|', 3)
                if len(parts) == 4:
                    return {
                        'version': version,
                        'commit_hash': parts[0][:8],
                        'author': parts[1],
                        'date': parts[2],
                        'message': parts[3]
                    }
            
            return {'version': version, 'error': 'Could not fetch repo info'}
        
        except Exception as e:
            current_app.logger.error(f"Error getting repo info for {version}: {e}")
            return {'version': version, 'error': str(e)}
