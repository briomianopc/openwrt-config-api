import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Upload,
  Settings,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Info,
  Loader,
  Package
} from 'lucide-react';
import { sessionAPI, configAPI } from '../services/api';
import { handleApiError, downloadFile } from '../utils/helpers';
import toast from 'react-hot-toast';
import ConfigTree from '../components/ConfigTree';
import FeedManager from '../components/FeedManager';
import ConfigCompare from '../components/ConfigCompare';
import api from '../services/api';

const ConfigPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // 状态管理
  const [session, setSession] = useState(null);
  const [configTree, setConfigTree] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadSession = useCallback(async () => {
    try {
      const response = await sessionAPI.getSession(sessionId);
      setSession(response.data);
    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo.message);
      toast.error('加载会话失败: ' + errorInfo.message);
    }
  }, [sessionId]);

  const loadConfigTree = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sessionAPI.getConfigTree(sessionId);
      setConfigTree(response.data);
      setError(null);
    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo.message);
      toast.error('加载配置树失败: ' + errorInfo.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // 加载会话和配置树
  useEffect(() => {
    loadSession();
    loadConfigTree();
  }, [loadSession, loadConfigTree]);

  // 搜索功能
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchQuery.length < 2) {
      setIsSearching(false);
      toast.error('搜索关键词至少需要 2 个字符');
      return;
    }

    setIsSearching(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await configAPI.searchSymbols(sessionId, searchQuery);
        if (cancelled) {
          return;
        }
        setSearchResults(response.data.results);
        if (response.data.truncated) {
          toast.info('搜索结果已截断，请使用更具体的关键词');
        }
      } catch (error) {
        if (!cancelled) {
          const errorInfo = handleApiError(error);
          toast.error('搜索失败: ' + errorInfo.message);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, sessionId]);

  // 更新配置值
  const handleSymbolUpdate = async (symbolName, newValue) => {
    try {
      await configAPI.updateSymbol(sessionId, symbolName, newValue);
      toast.success('配置已更新');
      // 重新加载配置树以反映更改
      loadConfigTree();
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error('更新失败: ' + errorInfo.message);
    }
  };

  // 上传配置文件
  const handleFileUpload = async (file) => {
    try {
      await configAPI.uploadConfig(sessionId, file);
      toast.success('配置文件已上传并加载');
      loadConfigTree();
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error('上传失败: ' + errorInfo.message);
    }
  };

  // 下载配置文件
  const handleDownload = async (type = 'full') => {
    try {
      const response =
        type === 'full'
          ? await configAPI.downloadConfig(sessionId)
          : await configAPI.downloadDiffConfig(sessionId);

      const filename = type === 'full' ? '.config' : 'diffconfig';
      downloadFile(response.data, filename);
      toast.success(`${type === 'full' ? '完整' : '最小'}配置文件已下载`);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error('下载失败: ' + errorInfo.message);
    }
  };

  // 刷新配置树
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadConfigTree().finally(() => {
      setIsRefreshing(false);
      toast.success('配置树已刷新');
    });
  };

  // 错误界面
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          返回首页
        </button>
      </div>
    );
  }

  // 加载界面
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">加载配置中...</p>
        <p className="text-sm text-gray-500 mt-2">
          首次加载可能需要几分钟，请耐心等待
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部工具栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* 左侧信息 */}
          <div className="flex items-start space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex-shrink-0 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              返回
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">配置编辑器</h1>
              {session && (
                <div className="mt-1 flex items-center space-x-2 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    版本: {session.version}
                  </span>
                  <span>•</span>
                  <span>会话: {session.session_id?.substring(0, 8)}...</span>
                  {session.workspace_size_mb !== undefined && (
                    <>
                      <span>•</span>
                      <span>大小: {session.workspace_size_mb} MB</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 右侧按钮组 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              刷新
            </button>
            <button
              onClick={() => handleDownload('full')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              完整配置
            </button>
            <button
              onClick={() => handleDownload('minimal')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              最小配置
            </button>
            <FileUploadButton onUpload={handleFileUpload} />
            <ConfigCompare sessionId={sessionId} api={api} />
            <FeedManager sessionId={sessionId} onFeedAdded={loadConfigTree} api={api} />
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索配置选项（名称、描述、帮助文本）..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {isSearching && (
            <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>

        {/* 搜索结果 */}
        {searchResults.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                搜索结果 ({searchResults.length})
              </h3>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                清除
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="font-mono text-sm font-semibold text-gray-900 truncate">
                          {result.name}
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {result.type}
                        </span>
                        {result.match_type && (
                          <span className="text-xs text-gray-500">
                            匹配: {result.match_type === 'name' ? '名称' : result.match_type === 'prompt' ? '描述' : '帮助文本'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{result.prompt}</div>
                      {result.path && (
                        <div className="text-xs text-gray-400 mt-1 truncate">{result.path}</div>
                      )}
                    </div>
                    <div className="ml-4 text-sm text-gray-600 font-mono">
                      {result.value || <span className="text-gray-400">(未设置)</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      {!searchQuery && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">提示</p>
            <ul className="space-y-1 text-xs">
              <li>• 点击配置项可以展开查看更多选项</li>
              <li>• 使用搜索功能快速定位配置项</li>
              <li>• Bool/Tristate 类型可以直接切换值</li>
              <li>• 其他类型点击"编辑"按钮修改值</li>
              <li>• 配置修改会自动保存，完成后记得下载配置文件</li>
            </ul>
          </div>
        </div>
      )}

      {/* 配置树 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {configTree ? (
          <div className="divide-y divide-gray-100">
            <ConfigTree
              node={configTree}
              onUpdate={handleSymbolUpdate}
              searchQuery={searchQuery}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">暂无配置数据</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 文件上传组件
const FileUploadButton = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file) => {
    if (file && (file.name.endsWith('.config') || file.name.endsWith('.txt'))) {
      onUpload(file);
    } else {
      toast.error('请选择有效的配置文件（.config 或 .txt）');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div
      className={`relative inline-block ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept=".config,.txt"
        onChange={(e) => handleFileSelect(e.target.files[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <button
        type="button"
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        <Upload className="h-4 w-4 mr-2" />
        上传配置
      </button>
    </div>
  );
};

export default ConfigPage;
