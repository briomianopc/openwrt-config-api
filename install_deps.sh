#!/bin/bash

echo "安装OpenWrt配置生成器依赖..."

# 检查Python版本
python3 --version || {
    echo "错误: 未找到Python3"
    exit 1
}

# 检查pip
python3 -m pip --version || {
    echo "错误: 未找到pip"
    exit 1
}

# 安装Python依赖
echo "安装Python依赖..."
python3 -m pip install -r requirements.txt

# 检查Redis是否运行
echo "检查Redis服务..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "警告: Redis服务未运行，请启动Redis服务"
    echo "Ubuntu/Debian: sudo systemctl start redis"
    echo "macOS: brew services start redis"
    echo "Docker: docker run -d -p 6379:6379 redis:alpine"
fi

echo "依赖安装完成！"
echo ""
echo "启动开发服务器:"
echo "  python3 run.py"
echo ""
echo "或使用Docker:"
echo "  cd docker && docker-compose up -d"