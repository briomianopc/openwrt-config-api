#!/bin/bash

echo "OpenWrt配置生成器 - 快速启动"
echo "================================"

# 检查是否在Docker环境中
if [ -f /.dockerenv ]; then
    echo "检测到Docker环境，启动应用..."
    python3 run.py
    exit 0
fi

# 检查Python依赖
echo "检查Python依赖..."
python3 -c "import flask" 2>/dev/null || {
    echo "安装Python依赖..."
    pip3 install -r requirements.txt
}

# 检查Redis
echo "检查Redis服务..."
redis-cli ping > /dev/null 2>&1 || {
    echo "警告: Redis服务未运行"
    echo "请启动Redis服务或使用Docker:"
    echo "  docker run -d -p 6379:6379 redis:alpine"
    echo ""
    echo "继续启动应用（某些功能可能不可用）..."
}

# 设置环境变量
export FLASK_ENV=development
export REDIS_URL=redis://localhost:6379/0

# 启动应用
echo "启动应用..."
echo "访问地址: http://localhost:5000"
echo "按Ctrl+C停止服务"
echo ""

python3 run.py