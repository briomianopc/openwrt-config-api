FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
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
    curl \
    redis-server \
    gosu \
    && rm -rf /var/lib/apt/lists/*

# 创建应用用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 复制依赖文件
COPY requirements.txt ./
COPY requirements-dev.txt* ./

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 复制启动脚本
COPY docker/start.sh /app/start.sh

# 创建数据目录
RUN mkdir -p /app/data/repos /app/data/workspaces /app/logs && \
    chown -R appuser:appuser /app && \
    chmod +x /app/start.sh

# 设置环境变量
ENV FLASK_ENV=production
ENV PYTHONPATH=/app
ENV OPENWRT_REPOS_DIR=/app/data/repos
ENV WORKSPACES_DIR=/app/data/workspaces

# 暴露端口
EXPOSE 5000

# 切换到应用用户
USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# 启动命令
CMD ["/app/start.sh"]
