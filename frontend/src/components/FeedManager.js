import React, { useState } from 'react';
import { Plus, X, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const FeedManager = ({ sessionId, onFeedAdded, api }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedData, setFeedData] = useState({
    name: '',
    uri: '',
    branch: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedData.name || !feedData.uri) {
      toast.error('请填写 Feed 名称和 URI');
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/session/${sessionId}/feeds`, feedData);
      toast.success('Feed 添加成功！配置树将重新加载...');
      setFeedData({ name: '', uri: '', branch: '' });
      setIsOpen(false);
      if (onFeedAdded) {
        onFeedAdded();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Feed 添加失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-4 w-4 mr-2" />
        添加自定义 Feed
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            添加自定义 Feed
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              添加自定义 Feed 将扩展可用的软件包和选项。这可能需要几分钟时间来下载和安装。
            </p>
          </div>

          <div>
            <label htmlFor="feedName" className="block text-sm font-medium text-gray-700 mb-1">
              Feed 名称 *
            </label>
            <input
              type="text"
              id="feedName"
              value={feedData.name}
              onChange={(e) => setFeedData({ ...feedData, name: e.target.value })}
              placeholder="例如: mypackages"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              只能包含字母、数字、下划线和破折号
            </p>
          </div>

          <div>
            <label htmlFor="feedUri" className="block text-sm font-medium text-gray-700 mb-1">
              Feed URI *
            </label>
            <input
              type="url"
              id="feedUri"
              value={feedData.uri}
              onChange={(e) => setFeedData({ ...feedData, uri: e.target.value })}
              placeholder="https://github.com/user/feed.git"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Git 仓库的 HTTPS 或 Git URL
            </p>
          </div>

          <div>
            <label htmlFor="feedBranch" className="block text-sm font-medium text-gray-700 mb-1">
              分支（可选）
            </label>
            <input
              type="text"
              id="feedBranch"
              value={feedData.branch}
              onChange={(e) => setFeedData({ ...feedData, branch: e.target.value })}
              placeholder="master"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              留空则使用默认分支
            </p>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  添加中...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  添加 Feed
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedManager;
