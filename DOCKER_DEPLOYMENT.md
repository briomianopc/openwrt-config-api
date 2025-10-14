# 🐳 Docker部署指南

## 📋 问题修复总结

### 原始问题
```
Error response from daemon: failed to create task for container: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: error during container init: error mounting "/root/openwrt-config-api/docker/docker/nginx.conf" to rootfs at "/etc/nginx/nginx.conf": create mountpoint for /etc/nginx/nginx.conf mount: cannot create subdirectories in "/var/lib/docker/overlay2/.../merged/etc/nginx/nginx.conf": not a directory: unknown: Are you trying to mount a directory onto a file (or vice-versa)? Check if the specified host path exists and is the expected type
```

### 问题分析
1. **路径错误**: docker-compose.yml中的挂载路径`./docker/nginx.conf`不正确
2. **上下文问题**: 在docker目录内运行时，路径应该是`./nginx.conf`
3. **依赖管理**: 缺少服务间的健康检查依赖

### 修复方案
1. ✅ 修正nginx.conf挂载路径
2. ✅ 创建ssl目录占位符
3. ✅ 添加服务健康检查依赖
4. ✅ 改进错误处理和重启策略

---

## 🚀 部署步骤

### 1. 环境准备
```bash
# 确保Docker和Docker Compose已安装
docker --version
docker compose version

# 克隆项目
git clone https://github.com/briomianopc/openwrt-config-api.git
cd openwrt-config-api
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

### 3. 启动服务
```bash
# 进入docker目录
cd docker

# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 4. 验证部署
```bash
# 检查健康状态
curl http://localhost/health

# 访问前端
open http://localhost
```

---

## 🔧 服务配置

### API服务
- **端口**: 5000
- **健康检查**: `/health`
- **依赖**: Redis
- **数据卷**: repos_data, workspaces_data, logs_data

### Redis服务
- **端口**: 6379
- **数据卷**: redis_data
- **配置**: 持久化存储，内存限制512MB

### 前端服务
- **构建**: 多阶段构建（Node.js + Nginx）
- **数据卷**: frontend_build
- **输出**: 静态文件到Nginx

### Nginx服务
- **端口**: 80 (HTTP), 443 (HTTPS)
- **配置**: 反向代理，静态文件服务
- **依赖**: API和前端服务
- **SSL**: 支持HTTPS（需要证书）

---

## 📁 目录结构

```
docker/
├── docker-compose.yml    # Docker Compose配置
├── Dockerfile           # API服务Dockerfile
├── nginx.conf          # Nginx配置文件
└── ssl/                # SSL证书目录
    └── .gitkeep        # 占位符文件
```

---

## 🛠️ 故障排除

### 常见问题

<details>
<summary><strong>挂载错误</strong></summary>

```bash
# 检查文件是否存在
ls -la docker/nginx.conf

# 检查权限
chmod 644 docker/nginx.conf

# 重新构建
docker compose down
docker compose up -d --build
```

</details>

<details>
<summary><strong>服务启动失败</strong></summary>

```bash
# 查看详细日志
docker compose logs api
docker compose logs nginx

# 检查服务状态
docker compose ps

# 重启特定服务
docker compose restart nginx
```

</details>

<details>
<summary><strong>端口冲突</strong></summary>

```bash
# 检查端口占用
netstat -tlnp | grep :80
netstat -tlnp | grep :5000

# 修改端口映射
# 编辑docker-compose.yml中的ports配置
```

</details>

### 日志查看
```bash
# 查看所有服务日志
docker compose logs

# 查看特定服务日志
docker compose logs api
docker compose logs nginx
docker compose logs redis

# 实时查看日志
docker compose logs -f api
```

---

## 🔄 更新和维护

### 更新服务
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose down
docker compose up -d --build
```

### 备份数据
```bash
# 备份Redis数据
docker compose exec redis redis-cli BGSAVE

# 备份配置文件
cp docker/nginx.conf docker/nginx.conf.backup
```

### 清理资源
```bash
# 停止所有服务
docker compose down

# 清理未使用的镜像
docker image prune -f

# 清理未使用的卷
docker volume prune -f
```

---

## 📊 监控和健康检查

### 健康检查端点
- **API健康**: `http://localhost/health`
- **Nginx状态**: `http://localhost/nginx_status` (如果配置)

### 监控命令
```bash
# 查看资源使用情况
docker stats

# 查看服务健康状态
docker compose ps

# 检查容器日志
docker compose logs --tail=100
```

---

## 🎯 最佳实践

1. **环境隔离**: 使用不同的.env文件管理不同环境
2. **数据持久化**: 使用Docker卷存储重要数据
3. **安全配置**: 定期更新镜像和依赖
4. **监控日志**: 设置日志轮转和监控
5. **备份策略**: 定期备份配置和数据

---

## 📞 支持

如果遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查Docker和Docker Compose版本
3. 查看服务日志获取详细错误信息
4. 提交Issue或联系支持团队

**Docker部署问题已完全修复！** 🎉