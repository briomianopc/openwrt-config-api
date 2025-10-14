#!/bin/bash

# 配置验证脚本 - 不依赖Docker

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 OpenWrt配置生成器 - 配置验证${NC}"
echo "=================================="

# 检查Python环境
echo -e "${YELLOW}检查Python环境...${NC}"
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✅ Python3: $(python3 --version)${NC}"
else
    echo -e "${RED}❌ Python3未安装${NC}"
    exit 1
fi

# 检查Node.js环境
echo -e "${YELLOW}检查Node.js环境...${NC}"
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js未安装${NC}"
    exit 1
fi

# 检查npm
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
else
    echo -e "${RED}❌ npm未安装${NC}"
    exit 1
fi

# 检查Redis
echo -e "${YELLOW}检查Redis环境...${NC}"
if command -v redis-server &> /dev/null; then
    echo -e "${GREEN}✅ Redis: $(redis-server --version | head -1)${NC}"
else
    echo -e "${RED}❌ Redis未安装${NC}"
    exit 1
fi

# 检查项目文件
echo -e "${YELLOW}检查项目文件...${NC}"

# 检查后端文件
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✅ requirements.txt${NC}"
else
    echo -e "${RED}❌ requirements.txt缺失${NC}"
    exit 1
fi

if [ -f "run.py" ]; then
    echo -e "${GREEN}✅ run.py${NC}"
else
    echo -e "${RED}❌ run.py缺失${NC}"
    exit 1
fi

# 检查前端文件
if [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✅ frontend/package.json${NC}"
else
    echo -e "${RED}❌ frontend/package.json缺失${NC}"
    exit 1
fi

# 检查Docker文件
if [ -f "docker/Dockerfile" ]; then
    echo -e "${GREEN}✅ docker/Dockerfile${NC}"
else
    echo -e "${RED}❌ docker/Dockerfile缺失${NC}"
    exit 1
fi

if [ -f "docker/docker-compose.yml" ]; then
    echo -e "${GREEN}✅ docker/docker-compose.yml${NC}"
else
    echo -e "${RED}❌ docker/docker-compose.yml缺失${NC}"
    exit 1
fi

# 检查脚本文件
if [ -f "deploy.sh" ]; then
    echo -e "${GREEN}✅ deploy.sh${NC}"
else
    echo -e "${RED}❌ deploy.sh缺失${NC}"
    exit 1
fi

if [ -f "quick_start.sh" ]; then
    echo -e "${GREEN}✅ quick_start.sh${NC}"
else
    echo -e "${RED}❌ quick_start.sh缺失${NC}"
    exit 1
fi

# 检查环境配置文件
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ .env.example${NC}"
else
    echo -e "${RED}❌ .env.example缺失${NC}"
    exit 1
fi

# 测试Python依赖安装
echo -e "${YELLOW}测试Python依赖...${NC}"
if python3 -c "import flask, redis, kconfiglib" 2>/dev/null; then
    echo -e "${GREEN}✅ Python依赖已安装${NC}"
else
    echo -e "${YELLOW}⚠️ Python依赖未完全安装，运行: pip3 install -r requirements.txt${NC}"
fi

# 测试前端依赖
echo -e "${YELLOW}测试前端依赖...${NC}"
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✅ 前端依赖已安装${NC}"
else
    echo -e "${YELLOW}⚠️ 前端依赖未安装，运行: cd frontend && npm install${NC}"
fi

# 检查端口占用
echo -e "${YELLOW}检查端口占用...${NC}"
if lsof -i :5000 &> /dev/null; then
    echo -e "${YELLOW}⚠️ 端口5000被占用${NC}"
else
    echo -e "${GREEN}✅ 端口5000可用${NC}"
fi

if lsof -i :3000 &> /dev/null; then
    echo -e "${YELLOW}⚠️ 端口3000被占用${NC}"
else
    echo -e "${GREEN}✅ 端口3000可用${NC}"
fi

if lsof -i :6379 &> /dev/null; then
    echo -e "${YELLOW}⚠️ 端口6379被占用${NC}"
else
    echo -e "${GREEN}✅ 端口6379可用${NC}"
fi

# 检查Redis连接
echo -e "${YELLOW}测试Redis连接...${NC}"
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✅ Redis连接正常${NC}"
else
    echo -e "${YELLOW}⚠️ Redis未运行，请启动: redis-server${NC}"
fi

echo ""
echo -e "${GREEN}🎉 配置验证完成！${NC}"
echo "=================================="
echo ""
echo "📋 下一步操作："
echo "1. 本地开发: ./quick_start.sh"
echo "2. Docker部署: 安装Docker后运行 ./deploy.sh start"
echo "3. 手动启动: 参考README.md中的详细说明"
echo ""
echo "🔗 相关链接："
echo "- 项目文档: README.md"
echo "- 环境配置: .env.example"
echo "- Docker配置: docker/"
echo "- 部署脚本: deploy.sh"