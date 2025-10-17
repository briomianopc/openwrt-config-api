#!/bin/bash

# OpenWrt配置生成器 - 快速启动脚本
# 用于本地开发和测试

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 OpenWrt配置生成器 - 快速启动${NC}"
echo "=================================="

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装，请先安装Python3"
    exit 1
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查Redis
if ! command -v redis-server &> /dev/null; then
    echo "❌ Redis未安装，请先安装Redis"
    exit 1
fi

echo "✅ 系统要求检查通过"

# 安装Python依赖
echo "📦 安装Python依赖..."
pip3 install -r requirements.txt

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
npm install
cd ..

# 启动Redis
echo "🔴 启动Redis服务器..."
redis-server --daemonize yes

# 等待Redis启动
sleep 2

# 检查Redis连接
if redis-cli ping &> /dev/null; then
    echo "✅ Redis启动成功"
else
    echo "❌ Redis启动失败"
    exit 1
fi

# 设置环境变量
export FLASK_ENV=development
export REDIS_URL=redis://localhost:6379/0
export SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')

# 启动后端服务
echo "🐍 启动后端服务..."
python3 run.py &
BACKEND_PID=$!

# 等待后端启动
sleep 5

# 检查后端服务
if curl -f http://localhost:5000/health &> /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# 启动前端服务
echo "⚛️ 启动前端服务..."
cd frontend
DANGEROUSLY_DISABLE_HOST_CHECK=true WDS_SOCKET_HOST=localhost PORT=3000 npm start &
FRONTEND_PID=$!

# 等待前端启动
sleep 10

echo ""
echo -e "${GREEN}🎉 服务启动完成！${NC}"
echo "=================================="
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:5000"
echo "❤️ 健康检查: http://localhost:5000/health"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; redis-cli shutdown 2>/dev/null || true; echo "✅ 服务已停止"; exit 0' INT

# 保持脚本运行
wait