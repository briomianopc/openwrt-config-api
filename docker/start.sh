#!/bin/bash

# 启动脚本 - 同时启动Redis和Flask应用

set -e

echo "🚀 启动OpenWrt配置生成器..."

# 启动Redis服务器
echo "📦 启动Redis服务器..."
redis-server --daemonize yes --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru

# 等待Redis启动
echo "⏳ 等待Redis启动..."
sleep 3

# 检查Redis连接
echo "🔍 检查Redis连接..."
redis-cli ping || {
    echo "❌ Redis连接失败"
    exit 1
}

echo "✅ Redis启动成功"

# 设置环境变量
export FLASK_ENV=${FLASK_ENV:-production}
export REDIS_URL=${REDIS_URL:-redis://localhost:6379/0}
export SECRET_KEY=${SECRET_KEY:-$(python3 -c 'import secrets; print(secrets.token_hex(32))')}
export LOG_LEVEL=${LOG_LEVEL:-INFO}
export MAX_SESSIONS_PER_IP=${MAX_SESSIONS_PER_IP:-5}
export SESSION_TTL=${SESSION_TTL:-3600}
export WORKERS=${WORKERS:-4}

# 创建必要目录
echo "📁 创建必要目录..."
mkdir -p /app/data/repos /app/data/workspaces /app/logs

# 设置权限（如果以root运行）
if [ "$(id -u)" = "0" ]; then
    chown -R appuser:appuser /app/data /app/logs 2>/dev/null || true
fi

# 启动应用
echo "🚀 启动应用..."
exec gunicorn -c gunicorn.conf.py "run:create_app()"