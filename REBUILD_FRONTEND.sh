#!/bin/bash

# 前端UI重构部署脚本
# 使用方法: ./REBUILD_FRONTEND.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          OpenWrt 配置生成器 - 前端UI重构部署脚本                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd /workspace/docker || exit 1

# 步骤 1: 停止现有服务
echo -e "${YELLOW}[1/5]${NC} 停止现有服务..."
docker compose down
echo -e "${GREEN}✅ 服务已停止${NC}"
echo ""

# 步骤 2: 重新构建前端镜像
echo -e "${YELLOW}[2/5]${NC} 重新构建前端镜像（可能需要几分钟）..."
docker compose build frontend --no-cache
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 前端镜像构建成功${NC}"
else
    echo -e "${RED}❌ 前端镜像构建失败${NC}"
    exit 1
fi
echo ""

# 步骤 3: 启动所有服务
echo -e "${YELLOW}[3/5]${NC} 启动所有服务..."
docker compose up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 服务启动成功${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    exit 1
fi
echo ""

# 步骤 4: 等待服务就绪
echo -e "${YELLOW}[4/5]${NC} 等待服务就绪（30秒）..."
sleep 30
echo ""

# 步骤 5: 验证服务
echo -e "${YELLOW}[5/5]${NC} 验证服务状态..."
echo ""

# 检查容器状态
echo -e "${BLUE}容器状态:${NC}"
docker compose ps
echo ""

# 检查前端
echo -e "${BLUE}前端检查:${NC}"
if curl -f http://localhost/ 2>/dev/null >/dev/null; then
    echo -e "${GREEN}✅ 前端服务正常${NC}"
else
    echo -e "${RED}❌ 前端服务异常${NC}"
    echo -e "${YELLOW}查看前端日志:${NC}"
    docker compose logs frontend | tail -20
fi
echo ""

# 检查API
echo -e "${BLUE}API检查:${NC}"
if curl -f http://localhost:5000/health 2>/dev/null >/dev/null; then
    echo -e "${GREEN}✅ API服务正常${NC}"
else
    echo -e "${RED}❌ API服务异常${NC}"
fi
echo ""

# 完成
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                🎉 前端UI重构部署完成！                               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}访问地址:${NC}"
echo -e "  • 前端应用: ${GREEN}http://localhost${NC}"
echo -e "  • API服务: ${GREEN}http://localhost:5000${NC}"
echo ""
echo -e "${BLUE}新功能:${NC}"
echo -e "  ✨ 全新的配置树界面"
echo -e "  ✨ 智能搜索和高亮"
echo -e "  ✨ Feed管理功能"
echo -e "  ✨ 配置比较功能"
echo -e "  ✨ 现代化的UI设计"
echo ""
echo -e "${BLUE}查看日志:${NC}"
echo -e "  docker compose logs -f frontend"
echo -e "  docker compose logs -f api"
echo ""
echo -e "${BLUE}管理命令:${NC}"
echo -e "  docker compose ps        # 查看状态"
echo -e "  docker compose stop      # 停止服务"
echo -e "  docker compose restart   # 重启服务"
echo ""
