#!/bin/bash

# 前端启动脚本
set -e

echo "🚀 启动OpenWrt配置生成器前端..."

# 进入前端目录
cd /workspace/frontend

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 创建环境变量文件（如果不存在）
if [ ! -f ".env" ]; then
    echo "⚙️  创建环境变量配置..."
    cat > .env << EOF
# React开发环境配置
REACT_APP_API_URL=http://localhost:5001/api
GENERATE_SOURCEMAP=false
FAST_REFRESH=true
EOF
fi

if [ ! -f ".env.local" ]; then
    echo "⚙️  创建本地环境配置..."
    cat > .env.local << EOF
# 本地开发环境配置
REACT_APP_API_URL=http://localhost:5001/api
GENERATE_SOURCEMAP=false
FAST_REFRESH=true
DANGEROUSLY_DISABLE_HOST_CHECK=true
EOF
fi

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 寻找可用端口
PORT=3000
while check_port $PORT; do
    PORT=$((PORT + 1))
    if [ $PORT -gt 3010 ]; then
        echo "❌ 无法找到可用端口 (3000-3010)"
        exit 1
    fi
done

echo "🌐 使用端口: $PORT"
echo "🔗 前端地址: http://localhost:$PORT"
echo "🔗 网络地址: http://$(hostname -I | awk '{print $1}'):$PORT"
echo ""

# 启动前端服务
echo "🎨 启动React开发服务器..."
PORT=$PORT npm start