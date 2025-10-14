#!/usr/bin/env python3
"""
基本功能测试脚本
"""
import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def test_imports():
    """测试模块导入"""
    print("测试模块导入...")
    
    try:
        from app import create_app
        print("✓ app模块导入成功")
    except Exception as e:
        print(f"✗ app模块导入失败: {e}")
        return False
    
    try:
        from app.config import config
        print("✓ config模块导入成功")
    except Exception as e:
        print(f"✗ config模块导入失败: {e}")
        return False
    
    try:
        from app.models.session import SessionManager
        print("✓ SessionManager导入成功")
    except Exception as e:
        print(f"✗ SessionManager导入失败: {e}")
        return False
    
    try:
        from app.services.kconfig_service import KconfigService
        print("✓ KconfigService导入成功")
    except Exception as e:
        print(f"✗ KconfigService导入失败: {e}")
        return False
    
    return True

def test_app_creation():
    """测试应用创建"""
    print("\n测试应用创建...")
    
    try:
        from app import create_app
        
        # 设置测试环境变量
        os.environ['FLASK_ENV'] = 'testing'
        os.environ['REDIS_URL'] = 'redis://localhost:6379/0'
        
        app = create_app('testing')
        print("✓ 应用创建成功")
        
        # 测试配置
        assert app.config['TESTING'] == True
        print("✓ 测试配置正确")
        
        return True
    except Exception as e:
        print(f"✗ 应用创建失败: {e}")
        return False

def test_health_endpoint():
    """测试健康检查端点"""
    print("\n测试健康检查端点...")
    
    try:
        from app import create_app
        
        os.environ['FLASK_ENV'] = 'testing'
        os.environ['REDIS_URL'] = 'redis://localhost:6379/0'
        
        app = create_app('testing')
        
        with app.test_client() as client:
            response = client.get('/health')
            print(f"✓ 健康检查端点响应状态: {response.status_code}")
            
            if response.status_code == 200:
                data = response.get_json()
                print(f"✓ 健康检查数据: {data}")
                return True
            else:
                print(f"✗ 健康检查端点返回错误状态: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"✗ 健康检查端点测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("OpenWrt配置生成器 - 基本功能测试")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_app_creation,
        test_health_endpoint,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"测试结果: {passed}/{total} 通过")
    
    if passed == total:
        print("✓ 所有基本功能测试通过！")
        return 0
    else:
        print("✗ 部分测试失败，请检查错误信息")
        return 1

if __name__ == '__main__':
    sys.exit(main())