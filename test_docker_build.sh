#!/bin/bash

# Docker构建测试脚本
set -e

echo "🐳 开始测试Docker构建..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，尝试启动..."
    sudo dockerd &
    sleep 5
fi

# 测试前端构建
echo "📦 测试前端Docker构建..."
cd /workspace/docker

# 设置环境变量
export SECRET_KEY="test-secret-key-for-build"

# 构建前端
echo "🔨 构建前端镜像..."
if docker compose build frontend; then
    echo "✅ 前端构建成功！"
else
    echo "❌ 前端构建失败"
    exit 1
fi

# 构建API
echo "🔨 构建API镜像..."
if docker compose build api; then
    echo "✅ API构建成功！"
else
    echo "❌ API构建失败"
    exit 1
fi

echo "🎉 所有Docker构建测试通过！"