import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Download, 
  Upload, 
  Settings, 
  ChevronRight, 
  ChevronDown,
  Check,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { sessionAPI, configAPI } from '../services/api';
import { handleApiError, downloadFile, debounce } from '../utils/helpers';
import toast from 'react-hot-toast';

const ConfigPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [configTree, setConfigTree] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (session) {
      loadConfigTree();
    }
  }, [session]);

  const loadSession = async () => {
    try {
      const response = await sessionAPI.getSession(sessionId);
      setSession(response.data);
    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo.message);
      toast.error('加载会话失败: ' + errorInfo.message);
    }
  };

  const loadConfigTree = async () => {
    try {
      setLoading(true);
      const response = await sessionAPI.getConfigTree(sessionId);
      setConfigTree(response.data);
    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo.message);
      toast.error('加载配置树失败: ' + errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = debounce(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await configAPI.searchSymbols(sessionId, query);
      setSearchResults(response.data.results);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error('搜索失败: ' + errorInfo.message);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

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

  const handleFileUpload = async (file) => {
    try {
      await configAPI.uploadConfig(sessionId, file);
      toast.success('配置文件已上传');
      loadConfigTree();
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error('上传失败: ' + errorInfo.message);
    }
  };

  const handleDownload = async (type = 'full') => {
    try {
      const response = type === 'full' 
        ? await configAPI.downloadConfig(sessionId)
        : await configAPI.downloadDiffConfig(sessionId);
      
      const filename = type === 'full' ? '.config' : 'diffconfig';
      downloadFile(response.data, filename);
      toast.success('配置文件已下载');
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error('下载失败: ' + errorInfo.message);
    }
  };

  const renderConfigNode = (node, level = 0) => {
    if (!node) return null;

    const nodeId = node.name || node.prompt || Math.random().toString();
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = node.children && node.children.length > 0;
    const indent = level * 20;

    return (
      <div key={nodeId} className="border-b border-gray-100 last:border-b-0">
        <div 
          className="flex items-center py-2 px-4 hover:bg-gray-50 cursor-pointer"
          style={{ paddingLeft: `${indent + 16}px` }}
          onClick={() => hasChildren && toggleNode(nodeId)}
        >
          {hasChildren && (
            <div className="mr-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 truncate">
                {node.prompt || node.name || 'Unknown'}
              </span>
              {node.type && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {node.type}
                </span>
              )}
            </div>
            
            {node.help && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {node.help}
              </p>
            )}
          </div>

          {node.type === 'symbol' && (
            <SymbolValueEditor
              symbol={node}
              onUpdate={handleSymbolUpdate}
            />
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child, index) => 
              renderConfigNode(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          返回首页
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-8 w-8 text-primary-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">加载配置中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部工具栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">配置编辑器</h1>
            {session && (
              <p className="text-gray-600 mt-1">
                版本: {session.version} | 会话: {session.session_id}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDownload('full')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              下载完整配置
            </button>
            <button
              onClick={() => handleDownload('minimal')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              下载最小配置
            </button>
            <FileUploadButton onUpload={handleFileUpload} />
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索配置选项..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          {isSearching && (
            <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-700">搜索结果</h3>
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  // 这里可以实现跳转到搜索结果
                  console.log('Navigate to:', result);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{result.name}</div>
                    <div className="text-sm text-gray-600">{result.prompt}</div>
                  </div>
                  <span className="text-xs text-gray-500">{result.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 配置树 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {configTree ? (
          <div className="divide-y divide-gray-100">
            {renderConfigNode(configTree)}
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

// 符号值编辑器组件
const SymbolValueEditor = ({ symbol, onUpdate }) => {
  const [value, setValue] = useState(symbol.value || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdate(symbol.name, value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(symbol.value || '');
    setIsEditing(false);
  };

  if (symbol.data_type === 'bool' || symbol.data_type === 'tristate') {
    return (
      <div className="flex items-center space-x-2">
        <select
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onUpdate(symbol.name, e.target.value);
          }}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value="n">n (No)</option>
          <option value="m">m (Module)</option>
          <option value="y">y (Yes)</option>
        </select>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="text-green-600 hover:text-green-700"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          className="text-red-600 hover:text-red-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 min-w-0 max-w-32 truncate">
        {value || '(未设置)'}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className="text-primary-600 hover:text-primary-700"
      >
        <Settings className="h-4 w-4" />
      </button>
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
      toast.error('请选择有效的配置文件（.config或.txt）');
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
      className={`relative inline-block ${
        isDragging ? 'ring-2 ring-primary-500' : ''
      }`}
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