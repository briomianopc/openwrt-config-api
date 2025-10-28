# 🚀 OpenWrt 配置生成器

<div align="center">

![OpenWrt Logo](https://img.shields.io/badge/OpenWrt-00B5E2?style=for-the-badge&logo=openwrt&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**一个现代化的在线OpenWrt配置文件生成工具**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

[快速开始](#-快速开始) • [功能特性](#-功能特性) • [技术栈](#-技术栈) • [部署指南](#-部署指南) • [API文档](#-api文档) • [贡献指南](#-贡献指南)

</div>

---

## ✨ 功能特性

### 🎯 核心功能
- **🎨 可视化配置** - 通过直观的界面配置OpenWrt选项，无需手动编辑配置文件
- **🔍 智能搜索** - 快速搜索和定位配置选项，支持名称、描述和帮助文本搜索
- **📤 配置导入** - 上传现有配置文件，自动解析并可视化显示当前配置
- **📥 配置导出** - 生成完整的.config文件或最小化的diffconfig文件
- **🔄 配置比较** - 比较不同配置文件之间的差异
- **🚀 多版本支持** - 支持多个OpenWrt版本的配置

### 🛡️ 安全特性
- **路径遍历防护** - 防止恶意路径访问
- **命令注入防护** - 清理和验证所有命令参数
- **速率限制** - 防止API滥用
- **文件类型验证** - 限制上传文件类型
- **会话管理** - 自动清理过期会话

---

## 🏗️ 技术栈

### 后端技术
<table>
<tr>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="40" height="40"/>
<br><b>Python 3.11+</b>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg" width="40" height="40"/>
<br><b>Flask</b>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="40" height="40"/>
<br><b>Redis</b>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg" width="40" height="40"/>
<br><b>Nginx</b>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="40" height="40"/>
<br><b>Docker</b>
</td>
</tr>
</table>

### 前端技术
<table>
<tr>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="40" height="40"/>
<br><b>React 18</b>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="40" height="40"/>
<br><b>Tailwind CSS</b>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="40" height="40"/>
<br><b>JavaScript</b>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/axios/axios-original.svg" width="40" height="40"/>
<br><b>Axios</b>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg" width="40" height="40"/>
<br><b>npm</b>
</td>
</tr>
</table>

---

## 🚀 快速开始

### 方式一：Docker Compose（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/briomianopc/openwrt-config-api.git
cd openwrt-config-api

# 2. 创建环境配置
cp .env.example .env

# 3. 启动服务
cd docker
docker-compose up -d

# 4. 访问应用
open http://localhost
```

### 方式二：本地开发

#### 后端开发

```bash
# 1. 安装Python依赖
pip install -r requirements.txt

# 2. 启动Redis服务
redis-server

# 3. 设置环境变量
export FLASK_ENV=development
export REDIS_URL=redis://localhost:6379/0

# 4. 启动后端服务
python run.py
```

#### 前端开发

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm start

# 4. 访问 http://localhost:3000
```

### 方式三：一键部署脚本

```bash
# 使用提供的部署脚本
./deploy_local.sh
```

---

## 📋 系统要求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| **Python** | 3.11+ | 3.12+ |
| **Node.js** | 18+ | 22+ |
| **Redis** | 6.0+ | 7.0+ |
| **内存** | 2GB | 4GB+ |
| **存储** | 5GB | 20GB+ |

---

## 🔧 配置选项

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

---

## 📚 API文档

### 会话管理

| 方法 | 端点 | 描述 |
|------|------|------|
| `POST` | `/api/session` | 创建新会话 |
| `GET` | `/api/session/{session_id}` | 获取会话信息 |
| `DELETE` | `/api/session/{session_id}` | 删除会话 |
| `GET` | `/api/session/{session_id}/tree` | 获取配置树 |

### 配置管理

| 方法 | 端点 | 描述 |
|------|------|------|
| `PUT` | `/api/session/{session_id}/symbol/{symbol_name}` | 更新符号值 |
| `POST` | `/api/session/{session_id}/config/upload` | 上传配置文件 |
| `GET` | `/api/session/{session_id}/config/download` | 下载完整配置 |
| `GET` | `/api/session/{session_id}/diffconfig/download` | 下载最小配置 |
| `GET` | `/api/session/{session_id}/search` | 搜索符号 |
| `POST` | `/api/session/{session_id}/compare` | 比较配置 |

### 健康检查

```bash
curl http://localhost:5000/health
```

响应示例：
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "checks": {
    "redis": "ok",
    "directories": {
      "repos": "ok",
      "workspaces": "ok"
    }
  }
}
```

---

## 🛠️ 开发指南

### 项目结构

```
openwrt-config-api/
├── 📁 app/                    # 后端应用
│   ├── 📁 api/               # API路由
│   ├── 📁 models/            # 数据模型
│   ├── 📁 services/          # 业务逻辑
│   └── 📁 utils/             # 工具函数
├── 📁 frontend/              # 前端应用
│   ├── 📁 src/
│   │   ├── 📁 components/    # React组件
│   │   ├── 📁 pages/         # 页面组件
│   │   ├── 📁 services/      # API服务
│   │   └── 📁 utils/         # 工具函数
│   └── 📁 public/            # 静态文件
├── 📁 docker/                # Docker配置
├── 📄 requirements.txt       # Python依赖
└── 📄 package.json          # Node.js依赖
```

### 代码规范

- **Python**: 遵循PEP 8，使用Black格式化
- **JavaScript**: 使用ESLint配置
- **CSS**: 使用Tailwind CSS
- **提交信息**: 使用约定式提交格式

### 测试

```bash
# 运行基本测试
python test_basic.py

# 运行Docker测试
./test_docker.sh
```

---

## 🐛 故障排除

### 常见问题

<details>
<summary><strong>Redis连接失败</strong></summary>

```bash
# 检查Redis服务状态
redis-cli ping

# 启动Redis服务
redis-server

# 检查端口占用
netstat -tlnp | grep 6379
```

</details>

<details>
<summary><strong>OpenWrt仓库克隆失败</strong></summary>

```bash
# 检查网络连接
ping github.com

# 验证OPENWRT_GIT_URL配置
echo $OPENWRT_GIT_URL

# 手动克隆测试
git clone https://github.com/openwrt/openwrt.git
```

</details>

<details>
<summary><strong>前端无法连接后端</strong></summary>

```bash
# 检查REACT_APP_API_URL配置
echo $REACT_APP_API_URL

# 确认后端服务正在运行
curl http://localhost:5000/health

# 检查CORS配置
```

</details>

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs api
docker-compose logs nginx
docker-compose logs redis
```

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

1. **Fork** 这个仓库
2. **创建** 你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. **提交** 你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. **推送** 到分支 (`git push origin feature/AmazingFeature`)
5. **打开** 一个Pull Request

### 贡献类型

- 🐛 Bug修复
- ✨ 新功能
- 📚 文档改进
- 🎨 代码风格
- ⚡ 性能优化
- 🧪 测试改进

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🙏 致谢

- [OpenWrt](https://openwrt.org/) - 开源路由器固件
- [kconfiglib](https://github.com/ulfalizer/kconfiglib) - Kconfig解析库
- [React](https://reactjs.org/) - 用户界面库
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架

---

## 📞 支持

如果你遇到任何问题或有任何建议，请：

- 🐛 [提交Issue](https://github.com/briomianopc/openwrt-config-api/issues)
- 💬 [参与讨论](https://github.com/briomianopc/openwrt-config-api/discussions)
- 📧 发送邮件到 [your-email@example.com]

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个星标！**

Made with ❤️ by [Your Name]

</div>