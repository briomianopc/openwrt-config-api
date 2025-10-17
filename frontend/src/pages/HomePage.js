import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Upload,
  Search,
  Download,
  Settings,
  AlertCircle,
  TrendingUp,
  Package,
  HardDrive,
  Loader
} from 'lucide-react';
import { sessionAPI } from '../services/api';
import { handleApiError } from '../utils/helpers';
import toast from 'react-hot-toast';

const HomePage = () => {
  const [version, setVersion] = useState('master');
  const [isCreating, setIsCreating] = useState(false);
  const [availableVersions, setAvailableVersions] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await sessionAPI.getStats();
      setStats(response.data);
      setAvailableVersions(response.data.available_versions || ['master']);
      if (response.data.available_versions && response.data.available_versions.length > 0) {
        setVersion(response.data.available_versions[0]);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // 如果统计信息加载失败，使用默认值
      setAvailableVersions(['master']);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleCreateSession = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const response = await sessionAPI.createSession(version);
      const { session_id } = response.data;

      toast.success('🎉 配置会话创建成功！');
      navigate(`/config/${session_id}`);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(`创建会话失败: ${errorInfo.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const features = [
    {
      icon: <Settings className="h-6 w-6" />,
      title: '可视化配置',
      description: '直观的树形界面浏览和编辑 OpenWrt 配置选项',
      color: 'blue'
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: '智能搜索',
      description: '快速搜索配置项，支持名称、描述和帮助文本',
      color: 'green'
    },
    {
      icon: <Upload className="h-6 w-6" />,
      title: '配置导入',
      description: '上传现有配置文件，自动解析并可视化显示',
      color: 'purple'
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: '配置导出',
      description: '生成完整或最小化的配置文件，方便使用',
      color: 'orange'
    },
    {
      icon: <Package className="h-6 w-6" />,
      title: 'Feed 管理',
      description: '添加自定义软件源，扩展可用软件包',
      color: 'pink'
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: '配置比较',
      description: '比较不同配置文件之间的差异，一目了然',
      color: 'indigo'
    }
  ];

  return (
    <div className="space-y-12">
      {/* 英雄区域 */}
      <div className="text-center">
        <div className="inline-block mb-4">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <Settings className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-6">
          OpenWrt 配置生成器
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
          在线生成和编辑 OpenWrt 配置文件
          <br />
          支持可视化配置、智能搜索、配置比较等强大功能
        </p>
      </div>

      {/* 快速开始卡片 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <Play className="h-6 w-6 mr-2 text-blue-600" />
          快速开始
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 版本选择 */}
          <div className="md:col-span-2">
            <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-2">
              选择 OpenWrt 版本
            </label>
            {isLoadingStats ? (
              <div className="flex items-center justify-center py-3 bg-white rounded-lg border border-gray-200">
                <Loader className="h-5 w-5 text-gray-400 animate-spin mr-2" />
                <span className="text-sm text-gray-500">加载版本列表...</span>
              </div>
            ) : (
              <select
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg"
              >
                {availableVersions.map(v => (
                  <option key={v} value={v}>
                    {v} {v === 'master' ? '(最新开发版)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 创建按钮 */}
          <div className="flex items-end">
            <button
              onClick={handleCreateSession}
              disabled={isCreating || isLoadingStats}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-lg font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {isCreating ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  创建中...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  开始配置
                </>
              )}
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">可用版本</div>
                  <div className="text-2xl font-semibold text-gray-900 mt-1">
                    {stats.version_count || 0}
                  </div>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">活跃会话</div>
                  <div className="text-2xl font-semibold text-gray-900 mt-1">
                    {stats.workspaces?.total_workspaces || 0}
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">存储使用</div>
                  <div className="text-2xl font-semibold text-gray-900 mt-1">
                    {stats.workspaces?.total_size_mb || 0} MB
                  </div>
                </div>
                <HardDrive className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 功能特性 */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">功能特性</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow hover:border-gray-300"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${feature.color}-100 text-${feature.color}-600 mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-3">使用说明</h3>
            <div className="text-amber-800 space-y-2 text-sm">
              <p><span className="font-semibold">1.</span> 选择您要使用的 OpenWrt 版本（推荐使用稳定版本）</p>
              <p><span className="font-semibold">2.</span> 点击"开始配置"创建新的配置会话（首次创建可能需要几分钟）</p>
              <p><span className="font-semibold">3.</span> 在配置界面中浏览和修改 OpenWrt 选项</p>
              <p><span className="font-semibold">4.</span> 使用搜索功能快速定位特定配置项</p>
              <p><span className="font-semibold">5.</span> 完成后下载生成的 .config 或 diffconfig 文件</p>
              <p><span className="font-semibold">6.</span> 将配置文件放到 OpenWrt 源码目录并编译</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
