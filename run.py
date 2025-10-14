#!/usr/bin/env python3
import os
import sys
from pathlib import Path
from app import create_app

# 添加应用根目录到Python路径
app_root = Path(__file__).parent
sys.path.insert(0, str(app_root))

def main():
    """主函数"""
    # 获取配置环境
    config_name = os.getenv('FLASK_ENV', 'development')
    
    # 创建应用
    app = create_app(config_name)
    
    # 开发环境运行配置
    if config_name == 'development':
        app.run(
            host=os.getenv('HOST', '0.0.0.0'),
            port=int(os.getenv('PORT', '5000')),
            debug=True,
            threaded=True
        )
    else:
        # 生产环境提示
        print("Production environment detected.")
        print("Please use a WSGI server like Gunicorn to run this application.")
        print("Example: gunicorn -c gunicorn.conf.py 'run:create_app()'")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
