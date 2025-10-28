import os
import multiprocessing

# 服务器套接字
bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
backlog = 2048

# 工作进程 - 限制最大工作进程数避免资源问题
max_workers = min(multiprocessing.cpu_count() * 2 + 1, 8)  # 最多8个工作进程
workers = int(os.getenv('WORKERS', max_workers))
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 2
max_requests = 1000
max_requests_jitter = 100

# 重启
preload_app = True
reload = os.getenv('FLASK_ENV') == 'development'

# 日志
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'
accesslog = os.getenv('ACCESS_LOG', '-')
errorlog = os.getenv('ERROR_LOG', '-')
loglevel = os.getenv('LOG_LEVEL', 'info').lower()
capture_output = True

# 进程命名
proc_name = 'openwrt-config-api'

# 用户和组（生产环境）
user = os.getenv('APP_USER')
group = os.getenv('APP_GROUP')

# 安全
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

def when_ready(server):
    """服务器就绪时的回调"""
    print(f"OpenWrt Config API is ready. PID: {os.getpid()}")

def worker_int(worker):
    """工作进程中断时的回调"""
    print(f"Worker {worker.pid} received SIGINT")

def pre_fork(server, worker):
    """工作进程分叉前的回调"""
    print(f"Worker {worker.pid} forked")

def post_fork(server, worker):
    """工作进程分叉后的回调"""
    print(f"Worker {worker.pid} spawned")

def worker_abort(worker):
    """工作进程异常退出时的回调"""
    print(f"Worker {worker.pid} aborted")
