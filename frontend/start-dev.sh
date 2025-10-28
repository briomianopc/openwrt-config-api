#!/bin/bash

# 前端开发服务器启动脚本
# 修复 allowedHosts 错误

echo "启动前端开发服务器..."

# 设置环境变量修复 allowedHosts 错误
export DANGEROUSLY_DISABLE_HOST_CHECK=true
export WDS_SOCKET_HOST=localhost
export WDS_SOCKET_PORT=3000
export GENERATE_SOURCEMAP=false

# 检查端口是否被占用
if lsof -i :3000 >/dev/null 2>&1; then
    echo "端口 3000 被占用，尝试使用端口 3001..."
    export PORT=3001
fi

# 如果默认端口被占用，尝试其他端口
if lsof -i :26053 >/dev/null 2>&1; then
    echo "默认端口被占用，使用端口 3002..."
    export PORT=3002
fi

# 启动开发服务器
npm start