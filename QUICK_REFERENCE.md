# 📖 快速参考指南

**OpenWrt 配置生成器 v2.0**

---

## 🚀 快速开始

### 最快速部署

```bash
cd /workspace
./REBUILD_FRONTEND.sh
```

**访问**: `http://localhost`

---

## 📁 重要文件位置

### 后端代码

```
app/
├── __init__.py              # Flask 应用初始化
├── config.py                # 配置系统（已重构）
├── api/
│   ├── session.py           # 会话管理 API
│   └── config.py            # 配置管理 API
├── services/
│   ├── kconfig_service.py   # Kconfig 处理
│   ├── repository_service.py # 仓库管理
│   └── workspace_service.py # 工作空间管理
├── models/
│   └── session.py           # 会话数据模型
└── utils/
    ├── security.py          # 安全工具
    └── validators.py        # 验证工具
```

### 前端代码

```
frontend/src/
├── components/
│   ├── ConfigTree.js        # ⭐ 配置树组件（新增）
│   ├── FeedManager.js       # ⭐ Feed管理（新增）
│   ├── ConfigCompare.js     # ⭐ 配置比较（新增）
│   └── Layout.js            # 布局组件
├── pages/
│   ├── HomePage.js          # ⭐ 首页（重构）
│   └── ConfigPage.js        # ⭐ 配置页面（重构）
├── services/
│   └── api.js               # API 服务
├── utils/
│   └── helpers.js           # 辅助函数
├── App.js                   # 应用根组件
├── index.js                 # 入口
└── index.css                # ⭐ 全局样式（重构）
```

### Docker 配置

```
docker/
├── docker-compose.yml       # ⭐ Docker编排（已修复）
├── Dockerfile               # ⭐ 后端镜像（已修复）
├── nginx.conf               # Nginx配置
└── start.sh                 # ⭐ 启动脚本（已修复）
```

### 文档

```
文档/
├── FRONTEND_REBUILD_GUIDE.md      # 前端重构指南
├── FRONTEND_API_MAPPING.md        # API映射表
├── COMPLETE_REBUILD_SUMMARY.md    # 完整重构总结
├── FINAL_SUMMARY.md               # 最终总结
├── FEASIBILITY_REVIEW_REPORT.md   # 可行性审查
├── URGENT_FIX_V2.md               # 配置重构详情
└── READY_TO_DEPLOY.md             # 部署指南
```

---

## 🔌 API 端点速查

### 会话管理

```bash
# 创建会话
POST /api/session
{"version": "master"}

# 获取会话信息
GET /api/session/{session_id}

# 获取配置树
GET /api/session/{session_id}/tree

# 获取统计
GET /api/session/stats
```

### 配置管理

```bash
# 更新符号值
PUT /api/session/{session_id}/symbol/{symbol_name}
{"value": "y"}

# 搜索符号
GET /api/session/{session_id}/search?q=CONFIG_&limit=50

# 上传配置
POST /api/session/{session_id}/config/upload
Content-Type: multipart/form-data

# 下载完整配置
GET /api/session/{session_id}/config/download

# 下载最小配置
GET /api/session/{session_id}/diffconfig/download
```

### 扩展功能

```bash
# 添加 Feed
POST /api/session/{session_id}/feeds
{"name": "mypackages", "uri": "https://..."}

# 比较配置
POST /api/session/{session_id}/compare
Content-Type: multipart/form-data
```

---

## 🛠️ 常用命令

### Docker 管理

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose stop

# 重启服务
docker compose restart

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f [service]

# 完全清理
docker compose down -v
```

### 服务名称

- `api` - 后端 API 服务
- `frontend` - 前端服务
- `redis` - Redis 缓存
- `nginx` - Web 服务器

### 调试命令

```bash
# 进入容器
docker compose exec [service] sh

# 查看 API 日志
docker compose logs -f api

# 查看前端日志
docker compose logs -f frontend

# 测试 Redis
docker compose exec redis redis-cli ping

# 查看环境变量
docker compose exec api env
```

---

## 🎯 功能使用

### 创建配置会话

1. 访问首页: `http://localhost`
2. 选择 OpenWrt 版本
3. 点击"开始配置"
4. 等待初始化完成

### 编辑配置

1. 在配置树中找到选项
2. 对于 Bool/Tristate：直接切换下拉菜单
3. 对于其他类型：点击"编辑"按钮
4. 修改会自动保存

### 搜索配置

1. 在搜索栏输入关键词（至少2个字符）
2. 查看搜索结果列表
3. 配置树中会高亮匹配项

### 上传配置

1. 点击"上传配置"按钮
2. 选择 .config 或 .txt 文件
3. 或直接拖放文件
4. 配置树自动更新

### 下载配置

- **完整配置**: 包含所有选项（用于直接编译）
- **最小配置**: 只包含修改的选项（推荐）

### 添加 Feed

1. 点击"添加自定义 Feed"
2. 填写 Feed 信息
3. 提交并等待安装
4. 配置树自动刷新

### 比较配置

1. 点击"比较配置"
2. 上传要比较的配置文件
3. 查看差异列表
4. 红色=当前，绿色=比较

---

## 🔍 故障排除

### 前端问题

**无法访问 http://localhost**
```bash
docker compose logs nginx
docker compose restart nginx
```

**页面显示空白**
```bash
docker compose logs frontend
# 查看浏览器控制台 (F12)
```

### 后端问题

**API 不响应**
```bash
docker compose logs api
curl http://localhost:5000/health
```

**Redis 连接失败**
```bash
docker compose logs redis
docker compose exec redis redis-cli ping
```

### 完全重建

```bash
cd /workspace/docker
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## 📊 性能优化提示

### 前端优化

- 搜索使用 300ms 防抖
- 配置树按需展开
- 懒加载渲染
- 状态缓存

### 后端优化

- Redis 会话缓存
- 硬链接节省存储
- 速率限制保护
- 后台清理任务

---

## 🎨 自定义配置

### 环境变量

```bash
# .env 文件
SECRET_KEY=your-secret-key
REDIS_URL=redis://redis:6379/0
CORS_ORIGINS=http://localhost,https://yourdomain.com
MAX_SESSIONS_PER_IP=5
SESSION_TTL=3600
```

### 修改端口

编辑 `docker/docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8080:80"  # 修改为 8080
```

---

## 📞 获取帮助

### 文档导航

| 需求 | 查看文档 |
|------|---------|
| 部署指南 | READY_TO_DEPLOY.md |
| 前端使用 | FRONTEND_REBUILD_GUIDE.md |
| API 集成 | FRONTEND_API_MAPPING.md |
| 问题修复 | URGENT_FIX_V2.md |
| 完整总结 | COMPLETE_REBUILD_SUMMARY.md |

### 日志位置

- 前端日志: `docker compose logs frontend`
- API 日志: `docker compose logs api`
- Nginx 日志: `docker compose logs nginx`
- Redis 日志: `docker compose logs redis`

---

## ✅ 检查清单

部署前检查:

- [ ] Docker 和 Docker Compose 已安装
- [ ] 端口 80, 5000, 6379 未被占用
- [ ] 磁盘空间充足（至少 10GB）
- [ ] 网络连接正常

部署后验证:

- [ ] 所有容器运行正常
- [ ] API 健康检查通过
- [ ] 前端页面可访问
- [ ] 可以创建会话
- [ ] 可以加载配置树

---

## 🎉 快速提示

💡 **首次创建会话需要几分钟** - 需要克隆 OpenWrt 仓库

💡 **使用搜索快速定位** - 至少输入 2 个字符

💡 **推荐下载最小配置** - 更小更易于管理

💡 **添加 Feed 后自动刷新** - 无需手动刷新

💡 **配置修改自动保存** - 无需点击保存按钮

---

**快速参考版本**: 1.0  
**最后更新**: 2025-10-17

**现在就可以使用了！运行 `./REBUILD_FRONTEND.sh` 开始！** 🚀
