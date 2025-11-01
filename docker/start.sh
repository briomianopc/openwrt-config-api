#!/bin/bash

# 启动脚本 - 同时启动Redis和Flask应用

set -e

echo "🚀 启动OpenWrt配置生成器..."

# 设置环境变量
export FLASK_ENV=${FLASK_ENV:-production}
export REDIS_URL=${REDIS_URL:-redis://localhost:6379/0}
export SECRET_KEY=${SECRET_KEY:-$(python3 -c 'import secrets; print(secrets.token_hex(32))')}
export LOG_LEVEL=${LOG_LEVEL:-INFO}
export MAX_SESSIONS_PER_IP=${MAX_SESSIONS_PER_IP:-5}
export SESSION_TTL=${SESSION_TTL:-3600}
export WORKERS=${WORKERS:-4}

parse_result=$(python3 - "${REDIS_URL}" <<'PY'
import sys
from urllib.parse import urlparse

url = urlparse(sys.argv[1])
host = url.hostname or 'localhost'
port = url.port or 6379
print(f"{host}:{port}")
PY
)

redis_host=${parse_result%%:*}
redis_port=${parse_result##*:}

if [[ "${redis_host}" == "localhost" || "${redis_host}" == "127.0.0.1" ]]; then
    echo "📦 启动内置Redis服务器..."
    redis-server --daemonize yes --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru

    echo "⏳ 等待Redis启动..."
    sleep 3

    echo "🔍 检查Redis连接..."
    redis-cli -h "${redis_host}" -p "${redis_port}" ping || {
        echo "❌ Redis连接失败"
        exit 1
    }

    echo "✅ Redis启动成功"
else
    echo "⏳ 等待外部Redis服务 ${redis_host}:${redis_port}..."
    until redis-cli -u "${REDIS_URL}" ping > /dev/null 2>&1; do
        sleep 1
    done
    echo "✅ 外部Redis连接成功"
fi

# 创建必要目录
echo "📁 创建必要目录..."
mkdir -p /app/data/repos /app/data/workspaces /app/logs

# 设置权限（如果以root运行）
if [ "$(id -u)" = "0" ]; then
    chown -R appuser:appuser /app/data /app/logs 2>/dev/null || true
    
    # 切换到应用用户
    echo "👤 切换到应用用户..."
    exec gosu appuser gunicorn -c gunicorn.conf.py "run:create_app()"
else
    # 已经是非root用户
    echo "👤 以当前用户运行..."
    exec gunicorn -c gunicorn.conf.py "run:create_app()"
fi