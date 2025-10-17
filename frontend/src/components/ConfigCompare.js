import React, { useState } from 'react';
import { GitCompare, Upload, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ConfigCompare = ({ sessionId, api }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleCompare = async () => {
    if (!selectedFile) {
      toast.error('请先选择配置文件');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post(`/session/${sessionId}/compare`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setCompareResult(response.data);
      toast.success(`找到 ${response.data.count} 处差异`);
    } catch (error) {
      toast.error(error.response?.data?.error || '配置比较失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCompareResult(null);
    setSelectedFile(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <GitCompare className="h-4 w-4 mr-2" />
        比较配置
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            配置比较
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* 文件选择 */}
          {!compareResult && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start space-x-2 mb-4">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  选择一个 .config 文件与当前配置进行比较
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".config,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="compareFile"
                />
                <label
                  htmlFor="compareFile"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-3" />
                  {selectedFile ? (
                    <span className="text-sm font-medium text-gray-700">
                      {selectedFile.name}
                    </span>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-700">
                        点击选择文件
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        支持 .config 和 .txt 文件
                      </span>
                    </>
                  )}
                </label>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleCompare}
                  disabled={!selectedFile || isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '比较中...' : '开始比较'}
                </button>
              </div>
            </div>
          )}

          {/* 比较结果 */}
          {compareResult && (
            <div>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  比较摘要
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">总差异数:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {compareResult.count}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">状态:</span>
                    <span className={`ml-2 font-semibold ${
                      compareResult.identical ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {compareResult.identical ? '完全相同' : '存在差异'}
                    </span>
                  </div>
                </div>
              </div>

              {compareResult.differences && compareResult.differences.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    差异详情
                  </h4>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {compareResult.differences.map((diff, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white border border-gray-200 rounded-md"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {diff.name}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {diff.type}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          {diff.prompt}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-red-50 rounded">
                            <span className="text-red-700 font-semibold">当前:</span>
                            <span className="ml-2 font-mono">{diff.current_value}</span>
                          </div>
                          <div className="p-2 bg-green-50 rounded">
                            <span className="text-green-700 font-semibold">比较:</span>
                            <span className="ml-2 font-mono">{diff.other_value}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <GitCompare className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-gray-600">配置完全相同，没有差异</p>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setCompareResult(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  重新比较
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigCompare;
