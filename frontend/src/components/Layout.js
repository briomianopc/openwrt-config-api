import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Github, ExternalLink } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo 和标题 */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md group-hover:shadow-lg transition-shadow">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  OpenWrt 配置生成器
                </h1>
                <p className="text-xs text-gray-500">在线配置工具</p>
              </div>
            </Link>

            {/* 右侧链接 */}
            <div className="flex items-center space-x-4">
              <a
                href="https://openwrt.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
              >
                <span>OpenWrt 官网</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://github.com/openwrt/openwrt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600">
              <p>
                © 2025 OpenWrt 配置生成器 |{' '}
                <a
                  href="https://openwrt.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  OpenWrt Project
                </a>
              </p>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <a
                href="https://openwrt.org/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900"
              >
                文档
              </a>
              <a
                href="https://forum.openwrt.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900"
              >
                论坛
              </a>
              <a
                href="https://github.com/openwrt/openwrt"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 flex items-center space-x-1"
              >
                <span>GitHub</span>
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
