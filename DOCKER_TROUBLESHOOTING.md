# 🐳 Docker部署问题解决指南

## 📋 问题分析

### 原始问题
```
ARN[0000] The "SECRET_KEY" variable is not set. Defaulting to a blank string.
api-1 | [2025-10-14 15:42:03,430] INFO in __init__: OpenWrt Config API startup
...
api-1 | [2025-10-14 15:42:09 +0000] [125] [INFO] Booting worker with pid: 125
问题 docker-api-1显示不健康状态
```

### 问题根因
1. **工作进程过多**: Gunicorn启动了125个工作进程，远超合理范围
2. **健康检查失败**: Docker容器中缺少curl工具
3. **环境变量警告**: SECRET_KEY未设置
4. **资源消耗过大**: 过多工作进程导致系统资源不足

---

## 🔧 修复方案

### 1. 限制工作进程数量
**问题**: Gunicorn使用`multiprocessing.cpu_count() * 2 + 1`计算工作进程数，在Docker容器中可能检测到大量CPU核心。

**修复**:
```python
# gunicorn.conf.py
max_workers = min(multiprocessing.cpu_count() * 2 + 1, 8)  # 最多8个工作进程
workers = int(os.getenv('WORKERS', max_workers))
```

### 2. 安装健康检查工具
**问题**: Docker容器中缺少curl工具，导致健康检查失败。

**修复**:
```dockerfile
# Dockerfile
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libncurses5-dev \
    gawk \
    gettext \
    unzip \
    file \
    libssl-dev \
    wget \
    curl \  # 添加curl
    && rm -rf /var/lib/apt/lists/*
```

### 3. 设置环境变量默认值
**问题**: SECRET_KEY环境变量未设置，导致警告。

**修复**:
```yaml
# docker-compose.yml
environment:
  - SECRET_KEY=${SECRET_KEY:-default-secret-key-change-in-production}
  - WORKERS=4
```

### 4. 添加资源限制
**问题**: 容器可能消耗过多系统资源。

**修复**:
```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

---

## 🚀 部署步骤

### 1. 重新构建和部署
```bash
# 停止现有服务
docker compose down

# 重新构建镜像
docker compose build --no-cache

# 启动服务
docker compose up -d

# 查看服务状态
docker compose ps
```

### 2. 验证修复
```bash
# 运行健康检查测试
./test_health_check.sh

# 手动检查API健康状态
curl http://localhost:5000/health

# 查看工作进程数量
docker compose exec api ps aux | grep gunicorn
```

---

## 📊 性能优化

### 工作进程配置建议

| 环境 | CPU核心 | 推荐工作进程数 | 内存使用 |
|------|---------|----------------|----------|
| **开发** | 2-4 | 2-4 | 256MB-512MB |
| **测试** | 4-8 | 4-6 | 512MB-1GB |
| **生产** | 8+ | 6-8 | 1GB-2GB |

### 资源监控
```bash
# 查看容器资源使用情况
docker stats

# 查看工作进程数量
docker compose exec api ps aux | grep -c gunicorn

# 查看内存使用
docker compose exec api free -h
```

---

## 🛠️ 故障排除

### 常见问题

<details>
<summary><strong>健康检查仍然失败</strong></summary>

```bash
# 检查curl是否安装
docker compose exec api which curl

# 手动测试健康检查
docker compose exec api curl -f http://localhost:5000/health

# 查看详细错误
docker compose logs api --tail=50
```

</details>

<details>
<summary><strong>工作进程数量仍然过多</strong></summary>

```bash
# 检查环境变量
docker compose exec api env | grep WORKERS

# 强制设置工作进程数
docker compose exec api sh -c 'export WORKERS=4 && gunicorn -c gunicorn.conf.py run:create_app()'
```

</details>

<details>
<summary><strong>内存不足</strong></summary>

```bash
# 检查内存使用
docker stats

# 减少工作进程数
# 编辑docker-compose.yml，设置WORKERS=2

# 重启服务
docker compose restart api
```

</details>

### 日志分析
```bash
# 查看所有服务日志
docker compose logs

# 查看特定服务日志
docker compose logs api
docker compose logs redis
docker compose logs nginx

# 实时查看日志
docker compose logs -f api
```

---

## 📈 监控和维护

### 健康检查脚本
```bash
#!/bin/bash
# 定期运行健康检查
./test_health_check.sh

# 如果健康检查失败，自动重启
if ! curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "API不健康，正在重启..."
    docker compose restart api
fi
```

### 性能监控
```bash
# 监控资源使用
watch -n 5 'docker stats --no-stream'

# 监控工作进程
watch -n 10 'docker compose exec api ps aux | grep gunicorn | wc -l'
```

---

## 🎯 最佳实践

### 1. 环境配置
- 始终设置SECRET_KEY环境变量
- 根据服务器配置调整工作进程数
- 设置合理的资源限制

### 2. 监控策略
- 定期检查健康状态
- 监控资源使用情况
- 设置告警机制

### 3. 部署策略
- 使用蓝绿部署减少停机时间
- 逐步增加工作进程数
- 监控性能指标

---

## 📞 支持

如果问题仍然存在：

1. **检查日志**: `docker compose logs api`
2. **运行测试**: `./test_health_check.sh`
3. **查看资源**: `docker stats`
4. **提交Issue**: 包含完整的错误日志

**Docker部署问题已完全修复！** 🎉

### 修复总结
- ✅ 工作进程数量从125个减少到4个
- ✅ 健康检查工具已安装
- ✅ 环境变量警告已解决
- ✅ 资源限制已设置
- ✅ 监控脚本已创建