#!/bin/bash

# OpenWrt配置生成器 - Docker部署脚本
# 使用方法: ./deploy.sh [start|stop|restart|build|logs|status]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="openwrt-config-api"
DOCKER_COMPOSE_FILE="docker/docker-compose.yml"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker和Docker Compose
check_requirements() {
    log_info "检查系统要求..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_success "系统要求检查通过"
}

# 创建环境配置文件
create_env_file() {
    if [ ! -f .env ]; then
        log_info "创建环境配置文件..."
        cat > .env << EOF
# OpenWrt配置生成器环境配置
SECRET_KEY=$(openssl rand -hex 32)
FLASK_ENV=production
REDIS_URL=redis://redis:6379/0
LOG_LEVEL=INFO
MAX_SESSIONS_PER_IP=5
SESSION_TTL=3600
WORKERS=4
RATE_LIMIT_STORAGE_URL=redis://redis:6379/1
EOF
        log_success "环境配置文件已创建"
    else
        log_info "环境配置文件已存在"
    fi
}

# 构建镜像
build_images() {
    log_info "构建Docker镜像..."
    
    # 构建后端镜像
    log_info "构建后端镜像..."
    docker compose -f $DOCKER_COMPOSE_FILE build api
    
    # 构建前端镜像
    log_info "构建前端镜像..."
    docker compose -f $DOCKER_COMPOSE_FILE build frontend
    
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 创建数据目录
    mkdir -p data/{repos,workspaces,logs}
    
    # 启动服务
    docker compose -f $DOCKER_COMPOSE_FILE up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    check_services_health
    
    log_success "服务启动完成"
    log_info "访问地址: http://localhost"
    log_info "API地址: http://localhost/api"
    log_info "健康检查: http://localhost/health"
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    docker compose -f $DOCKER_COMPOSE_FILE down
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    stop_services
    start_services
}

# 查看日志
show_logs() {
    log_info "显示服务日志..."
    docker compose -f $DOCKER_COMPOSE_FILE logs -f
}

# 检查服务状态
check_services_health() {
    log_info "检查服务状态..."
    
    # 检查API服务
    if curl -f http://localhost:5000/health &> /dev/null; then
        log_success "API服务运行正常"
    else
        log_warning "API服务可能未完全启动，请稍等片刻"
    fi
    
    # 检查Nginx服务
    if curl -f http://localhost &> /dev/null; then
        log_success "Web服务运行正常"
    else
        log_warning "Web服务可能未完全启动，请稍等片刻"
    fi
}

# 显示服务状态
show_status() {
    log_info "服务状态:"
    docker compose -f $DOCKER_COMPOSE_FILE ps
    
    echo ""
    log_info "资源使用情况:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# 清理资源
cleanup() {
    log_info "清理Docker资源..."
    
    # 停止并删除容器
    docker compose -f $DOCKER_COMPOSE_FILE down -v
    
    # 删除未使用的镜像
    docker image prune -f
    
    log_success "清理完成"
}

# 显示帮助信息
show_help() {
    echo "OpenWrt配置生成器 - Docker部署脚本"
    echo ""
    echo "使用方法: $0 [命令]"
    echo ""
    echo "可用命令:"
    echo "  start     - 启动所有服务"
    echo "  stop      - 停止所有服务"
    echo "  restart   - 重启所有服务"
    echo "  build     - 构建Docker镜像"
    echo "  logs      - 查看服务日志"
    echo "  status    - 显示服务状态"
    echo "  cleanup   - 清理Docker资源"
    echo "  help      - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start    # 启动服务"
    echo "  $0 logs     # 查看日志"
    echo "  $0 status   # 检查状态"
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            check_requirements
            create_env_file
            build_images
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        build)
            check_requirements
            build_images
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
