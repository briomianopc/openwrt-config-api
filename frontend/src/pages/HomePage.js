import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Upload, Search, Download, Settings, AlertCircle } from 'lucide-react';
import { sessionAPI } from '../services/api';
import { handleApiError } from '../utils/helpers';
import toast from 'react-hot-toast';

const HomePage = () => {
  const [version, setVersion] = useState('master');
  const [isCreating, setIsCreating] = useState(false);
  const [availableVersions, setAvailableVersions] = useState([]);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await sessionAPI.getStats();
      setStats(response.data);
      setAvailableVersions(response.data.available_versions || []);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCreateSession = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const response = await sessionAPI.createSession(version);
      const { session_id } = response.data;
      
      toast.success('会话创建成功！');
      navigate(`/config/${session_id}`);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    } finally {
      setIsCreating(false);
    }
  };

  const features = [
    {
      icon: <Settings className="h-6 w-6" />,
      title: '可视化配置',
      description: '通过直观的界面配置OpenWrt选项，无需手动编辑配置文件'
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: '智能搜索',
      description: '快速搜索和定位配置选项，支持名称、描述和帮助文本搜索'
    },
    {
      icon: <Upload className="h-6 w-6" />,
      title: '配置导入',
      description: '上传现有配置文件，自动解析并可视化显示当前配置'
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: '配置导出',
      description: '生成完整的.config文件或最小化的diffconfig文件'
    }
  ];

  return (
    <div className="space-y-12">
      {/* 英雄区域 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          OpenWrt 配置生成器
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
          在线生成和编辑OpenWrt配置文件，支持可视化配置、智能搜索、配置比较等功能
        </p>
      </div>

      {/* 快速开始 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">快速开始</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-2">
              OpenWrt 版本
            </label>
            <select
              id="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {availableVersions.length > 0 ? (
                availableVersions.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))
              ) : (
                <option value="master">master (默认)</option>
              )}
            </select>
          </div>
          
          <button
            onClick={handleCreateSession}
            disabled={isCreating}
            className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                创建中...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                开始配置
              </>
            )}
          </button>
        </div>

        {stats && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">可用版本</div>
              <div className="text-2xl font-semibold text-gray-900">
                {stats.version_count || 0}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">活跃工作空间</div>
              <div className="text-2xl font-semibold text-gray-900">
                {stats.workspaces?.total_workspaces || 0}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">总存储使用</div>
              <div className="text-2xl font-semibold text-gray-900">
                {stats.workspaces?.total_size_mb || 0} MB
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 功能特性 */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">功能特性</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="text-primary-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">使用说明</h3>
            <div className="text-blue-800 space-y-2">
              <p>1. 选择您要使用的OpenWrt版本（默认为master分支）</p>
              <p>2. 点击"开始配置"创建新的配置会话</p>
              <p>3. 在配置界面中浏览和修改OpenWrt选项</p>
              <p>4. 使用搜索功能快速定位特定配置项</p>
              <p>5. 完成后下载生成的配置文件</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;