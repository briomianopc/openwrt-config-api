# OpenWrt 配置生成器

一个现代化的在线OpenWrt配置文件生成工具，提供可视化配置界面、智能搜索、配置比较等功能。

## 功能特性

- 🎯 **可视化配置**: 通过直观的界面配置OpenWrt选项，无需手动编辑配置文件
- 🔍 **智能搜索**: 快速搜索和定位配置选项，支持名称、描述和帮助文本搜索
- 📤 **配置导入**: 上传现有配置文件，自动解析并可视化显示当前配置
- 📥 **配置导出**: 生成完整的.config文件或最小化的diffconfig文件
- 🔄 **配置比较**: 比较不同配置文件之间的差异
- 🚀 **多版本支持**: 支持多个OpenWrt版本的配置
- 🛡️ **安全可靠**: 内置安全机制，防止路径遍历和命令注入攻击

## 技术栈

### 后端
- **Flask**: Python Web框架
- **Redis**: 会话存储和缓存
- **kconfiglib**: Kconfig解析库
- **Gunicorn**: WSGI服务器
- **Nginx**: 反向代理和静态文件服务

### 前端
- **React 18**: 用户界面框架
- **React Router**: 客户端路由
- **Tailwind CSS**: 样式框架
- **Lucide React**: 图标库
- **Axios**: HTTP客户端
- **React Hot Toast**: 通知组件

## 快速开始

### 使用Docker Compose（推荐）

1. 克隆项目
```bash
git clone <repository-url>
cd openwrt-config-generator
```

2. 复制环境配置文件
```bash
cp .env.example .env
```

3. 编辑环境变量（可选）
```bash
nano .env
```

4. 启动服务
```bash
cd docker
docker-compose up -d
```

5. 访问应用
打开浏览器访问 http://localhost

### 本地开发

#### 后端开发

1. 安装Python依赖
```bash
pip install -r requirements.txt
```

2. 启动Redis服务
```bash
redis-server
```

3. 设置环境变量
```bash
export FLASK_ENV=development
export REDIS_URL=redis://localhost:6379/0
```

4. 启动后端服务
```bash
python run.py
```

#### 前端开发

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

4. 访问 http://localhost:3000

## 使用说明

### 创建配置会话

1. 在首页选择OpenWrt版本（默认为master）
2. 点击"开始配置"按钮
3. 系统将创建新的配置会话并跳转到配置界面

### 配置选项

1. **浏览配置树**: 在左侧面板中展开和折叠配置节点
2. **搜索配置**: 使用搜索框快速定位特定配置项
3. **修改配置**: 点击配置项右侧的编辑按钮修改值
4. **上传配置**: 使用"上传配置"按钮导入现有配置文件

### 导出配置

1. **下载完整配置**: 生成包含所有配置项的.config文件
2. **下载最小配置**: 生成只包含非默认值的diffconfig文件

## API文档

### 会话管理

- `POST /api/session` - 创建新会话
- `GET /api/session/{session_id}` - 获取会话信息
- `DELETE /api/session/{session_id}` - 删除会话
- `GET /api/session/{session_id}/tree` - 获取配置树

### 配置管理

- `PUT /api/session/{session_id}/symbol/{symbol_name}` - 更新符号值
- `POST /api/session/{session_id}/config/upload` - 上传配置文件
- `GET /api/session/{session_id}/config/download` - 下载完整配置
- `GET /api/session/{session_id}/diffconfig/download` - 下载最小配置
- `GET /api/session/{session_id}/search` - 搜索符号
- `POST /api/session/{session_id}/compare` - 比较配置

## 配置选项

### 环境变量

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `FLASK_ENV` | `development` | Flask环境 |
| `SECRET_KEY` | 随机生成 | Flask密钥 |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis连接URL |
| `OPENWRT_GIT_URL` | `https://github.com/openwrt/openwrt.git` | OpenWrt仓库URL |
| `SESSION_TTL` | `3600` | 会话超时时间（秒） |
| `MAX_SESSIONS_PER_IP` | `5` | 每IP最大会话数 |
| `MAX_UPLOAD_SIZE` | `10485760` | 最大上传文件大小（字节） |

### Docker配置

- **端口映射**: 80:80 (HTTP), 443:443 (HTTPS)
- **数据卷**: 
  - `repos_data`: OpenWrt仓库数据
  - `workspaces_data`: 工作空间数据
  - `redis_data`: Redis数据
  - `logs_data`: 日志文件

## 安全特性

- **路径遍历防护**: 防止恶意路径访问
- **命令注入防护**: 清理和验证所有命令参数
- **速率限制**: 防止API滥用
- **文件类型验证**: 限制上传文件类型
- **会话管理**: 自动清理过期会话

## 故障排除

### 常见问题

1. **Redis连接失败**
   - 检查Redis服务是否运行
   - 验证REDIS_URL配置

2. **OpenWrt仓库克隆失败**
   - 检查网络连接
   - 验证OPENWRT_GIT_URL配置

3. **前端无法连接后端**
   - 检查REACT_APP_API_URL配置
   - 确认后端服务正在运行

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs api
docker-compose logs nginx
```

## 开发指南

### 项目结构

```
├── app/                    # 后端应用
│   ├── api/               # API路由
│   ├── models/            # 数据模型
│   ├── services/          # 业务逻辑
│   └── utils/             # 工具函数
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   └── utils/         # 工具函数
│   └── public/            # 静态文件
├── docker/                # Docker配置
└── requirements.txt       # Python依赖
```

### 代码规范

- Python: 遵循PEP 8
- JavaScript: 使用ESLint配置
- CSS: 使用Tailwind CSS
- 提交信息: 使用约定式提交格式

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的配置生成功能
- 提供Web界面
- 支持多版本OpenWrt