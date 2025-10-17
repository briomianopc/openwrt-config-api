# 更改日志

## [未发布] - 2025-10-17

### 🔧 修复
- **[严重]** 修复 Docker Compose 中 Redis 连接配置错误 (localhost -> redis)
- **[严重]** 修复 app/config.py 中 RATE_LIMIT_STORAGE_URL 循环引用错误
- **[中等]** 修复 Docker 镜像缺少 gosu 工具的问题
- **[中等]** 修复 Repository Service 中分支名处理不当的问题
- **[轻微]** 修复健康检查中 START_TIME 未定义的问题
- **[轻微]** 修复 testing 属性访问的安全性问题

### ✨ 改进
- 将 CORS 配置改为环境变量可配置
- 增强启动脚本的容错性，支持非 root 用户运行
- 改进 Repository Service 的分支检测逻辑，自动回退到 main 分支
- 优化配置类，使用属性方法避免循环引用

### 📝 文档
- 新增 `FEASIBILITY_REVIEW_REPORT.md` - 完整的可行性审查报告
- 新增 `FIXES_SUMMARY.md` - 修复摘要文档
- 新增 `CHANGES.md` - 更改日志

### 🔒 安全性
- 所有已知安全问题已修复
- 路径遍历防护 ✅
- 命令注入防护 ✅
- 速率限制 ✅
- 输入验证 ✅

### 🚀 部署
- Docker 部署配置已优化并测试通过
- 所有服务可以正常启动和通信
- 健康检查配置完善

---

## 修改的文件

### 配置文件
- `docker/docker-compose.yml` - Redis 连接配置修复
- `app/config.py` - 配置类重构，避免循环引用

### Docker 文件
- `docker/Dockerfile` - 添加 gosu 依赖
- `docker/start.sh` - 增强启动逻辑

### 应用代码
- `app/__init__.py` - 添加 START_TIME 配置和 CORS 环境变量支持
- `app/services/repository_service.py` - 改进分支检测逻辑
- `app/utils/security.py` - 增强 testing 属性访问安全性

### 文档
- `FEASIBILITY_REVIEW_REPORT.md` (新增)
- `FIXES_SUMMARY.md` (新增)
- `CHANGES.md` (新增)

---

## 兼容性说明

### 破坏性变更
无

### 新增环境变量
- `CORS_ORIGINS` - CORS 允许的域名列表（逗号分隔），默认值：`http://localhost,http://localhost:80,http://localhost:3000`

### 配置迁移
如果您之前部署过此应用：
1. 更新 `docker-compose.yml` 中的 Redis URL 配置
2. 重新构建 Docker 镜像：`docker compose build`
3. 重启服务：`docker compose up -d`

---

## 验证步骤

1. ✅ 拉取最新代码
2. ✅ 运行 `./deploy.sh build` 构建镜像
3. ✅ 运行 `./deploy.sh start` 启动服务
4. ✅ 访问 `http://localhost/health` 检查健康状态
5. ✅ 访问 `http://localhost` 测试前端界面

---

*最后更新: 2025-10-17*
