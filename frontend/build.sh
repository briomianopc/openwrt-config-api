#!/bin/bash

echo "构建前端应用..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js未安装"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: npm未安装"
    exit 1
fi

# 安装依赖
echo "安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "错误: 依赖安装失败"
    exit 1
fi

# 构建应用
echo "构建应用..."
npm run build

if [ $? -ne 0 ]; then
    echo "错误: 应用构建失败"
    exit 1
fi

echo "✓ 前端应用构建成功！"
echo "构建文件位于: build/"