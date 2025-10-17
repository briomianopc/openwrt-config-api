# 🚀 快速修复指南

## 问题: Flask-Limiter 配置错误

**错误**: `AttributeError: 'property' object has no attribute 'decode'`

---

## ⚡ 快速修复（5分钟）

### 步骤 1: 停止服务
```bash
cd /workspace/docker
docker compose down
```

### 步骤 2: 验证修复已应用
```bash
# 检查 app/config.py 是否包含 __post_init__ 方法
grep -A 5 "__post_init__" /workspace/app/config.py
```

**预期输出**:
```python
def __post_init__(self):
    """在初始化后设置依赖其他配置的值"""
    # 速率限制配置 - 如果未设置则使用 REDIS_URL
    if not hasattr(self, 'RATE_LIMIT_STORAGE_URL'):
        self.RATE_LIMIT_STORAGE_URL = os.getenv('RATE_LIMIT_STORAGE_URL', self.REDIS_URL)
```

### 步骤 3: 重新构建 API 镜像
```bash
docker compose build api
```

### 步骤 4: 启动所有服务
```bash
docker compose up -d
```

### 步骤 5: 验证服务状态
```bash
# 查看所有容器状态
docker compose ps

# 查看 API 日志（应该没有错误）
docker compose logs api

# 测试健康检查
curl http://localhost:5000/health
```

---

## ✅ 成功标志

1. **容器状态**: 所有容器显示 "Up" 或 "healthy"
2. **API 日志**: 看到 "OpenWrt Config API startup" 且无错误
3. **健康检查**: 返回 `{"status": "healthy"}`

---

## ❌ 如果仍然失败

### 查看详细日志
```bash
docker compose logs -f api
```

### 完全重建
```bash
# 停止并删除所有容器和卷
docker compose down -v

# 清理镜像
docker compose build --no-cache api

# 重新启动
docker compose up -d
```

### 手动测试配置
```bash
# 进入 API 容器
docker compose exec api python3 -c "
from app.config import config
cfg = config['production']()
print('REDIS_URL:', cfg.REDIS_URL)
print('RATE_LIMIT_STORAGE_URL:', cfg.RATE_LIMIT_STORAGE_URL)
print('Type:', type(cfg.RATE_LIMIT_STORAGE_URL))
"
```

---

## 📞 获取帮助

如果问题持续存在，请：
1. 查看 [URGENT_FIX.md](URGENT_FIX.md) 了解详细技术说明
2. 检查 Docker 日志: `docker compose logs`
3. 确认 app/config.py 的修改已正确应用

---

*快速修复指南 v1.0*
