#!/bin/bash

echo "测试Docker环境..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose未安装"
    exit 1
fi

# 进入docker目录
cd docker

# 构建镜像
echo "构建Docker镜像..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "错误: Docker镜像构建失败"
    exit 1
fi

# 启动服务
echo "启动服务..."
docker-compose up -d

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

# 测试健康检查
echo "测试健康检查..."
curl -f http://localhost/health || {
    echo "错误: 健康检查失败"
    docker-compose logs
    exit 1
}

echo "✓ Docker环境测试通过！"
echo ""
echo "访问应用: http://localhost"
echo "停止服务: docker-compose down"