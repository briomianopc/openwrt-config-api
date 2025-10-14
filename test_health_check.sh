#!/bin/bash

# 健康检查测试脚本
set -e

echo "🏥 开始健康检查测试..."

# 检查服务是否运行
echo "📋 检查Docker服务状态..."
if ! docker compose ps | grep -q "Up"; then
    echo "❌ Docker服务未运行，请先启动服务"
    echo "运行: cd docker && docker compose up -d"
    exit 1
fi

echo "✅ Docker服务正在运行"

# 等待服务启动
echo "⏳ 等待服务完全启动..."
sleep 10

# 检查API健康状态
echo "🔍 检查API健康状态..."
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ API健康检查通过"
    
    # 显示健康检查详情
    echo "📊 API健康状态详情:"
    curl -s http://localhost:5000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:5000/health
else
    echo "❌ API健康检查失败"
    echo "🔍 检查API日志:"
    docker compose logs api --tail=20
    exit 1
fi

# 检查前端
echo "🌐 检查前端服务..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 前端服务正常"
else
    echo "⚠️  前端服务可能未完全启动，请稍等..."
fi

# 检查Redis
echo "🗄️  检查Redis服务..."
if docker compose exec redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis服务正常"
else
    echo "❌ Redis服务异常"
    exit 1
fi

# 检查工作进程数量
echo "👥 检查API工作进程数量..."
worker_count=$(docker compose exec api ps aux | grep -c "gunicorn.*worker" || echo "0")
echo "📊 当前工作进程数量: $worker_count"

if [ "$worker_count" -gt 10 ]; then
    echo "⚠️  工作进程数量过多，可能影响性能"
else
    echo "✅ 工作进程数量正常"
fi

echo ""
echo "🎉 所有健康检查通过！"
echo ""
echo "📱 服务访问地址:"
echo "   - 前端: http://localhost:3000"
echo "   - API: http://localhost:5000"
echo "   - 健康检查: http://localhost:5000/health"
echo ""
echo "📝 管理命令:"
echo "   - 查看日志: docker compose logs -f"
echo "   - 重启服务: docker compose restart"
echo "   - 停止服务: docker compose down"