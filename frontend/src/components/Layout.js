import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Github, Download } from 'lucide-react';
import { cn } from '../utils/helpers';

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center space-x-2 text-gray-900 hover:text-primary-600 transition-colors"
              >
                <Settings className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold">OpenWrt Config Generator</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/openwrt/openwrt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="OpenWrt GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <span className="text-sm text-gray-500">
                v1.0.0
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>
              OpenWrt Configuration Generator - 在线生成OpenWrt配置文件
            </p>
            <p className="mt-2">
              基于 <a href="https://github.com/openwrt/openwrt" className="text-primary-600 hover:text-primary-700">OpenWrt</a> 项目
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;