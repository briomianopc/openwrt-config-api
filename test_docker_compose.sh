#!/bin/bash

# Docker Compose测试脚本
set -e

echo "🐳 开始测试Docker Compose配置..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，尝试启动..."
    sudo dockerd &
    sleep 5
fi

# 进入docker目录
cd /workspace/docker

# 设置环境变量
export SECRET_KEY="test-secret-key-for-docker-compose"

echo "📋 检查配置文件..."

# 检查nginx.conf是否存在
if [ ! -f "nginx.conf" ]; then
    echo "❌ nginx.conf文件不存在"
    exit 1
fi
echo "✅ nginx.conf文件存在"

# 检查ssl目录是否存在
if [ ! -d "ssl" ]; then
    echo "❌ ssl目录不存在"
    exit 1
fi
echo "✅ ssl目录存在"

# 验证docker-compose.yml语法
echo "🔍 验证docker-compose.yml语法..."
if docker compose config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml语法正确"
else
    echo "❌ docker-compose.yml语法错误"
    docker compose config
    exit 1
fi

# 测试构建（不启动服务）
echo "🔨 测试构建服务..."
if docker compose build --no-cache; then
    echo "✅ 所有服务构建成功"
else
    echo "❌ 服务构建失败"
    exit 1
fi

echo "🎉 Docker Compose配置测试通过！"
echo ""
echo "📝 要启动服务，请运行："
echo "   cd /workspace/docker"
echo "   docker compose up -d"
echo ""
echo "📝 要查看日志，请运行："
echo "   docker compose logs -f"