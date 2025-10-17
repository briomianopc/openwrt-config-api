import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Check, X, Info } from 'lucide-react';

const ConfigTree = ({ node, onUpdate, level = 0, searchQuery = '' }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.value || '');

  if (!node) return null;

  // 搜索匹配
  const matchesSearch = searchQuery && (
    node.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.help?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 如果有搜索且当前节点或子节点匹配，则展开
  const shouldExpand = searchQuery && (matchesSearch || hasMatchingChildren(node, searchQuery));

  const hasChildren = node.children && node.children.length > 0;
  const indent = level * 20;

  const handleSave = () => {
    if (onUpdate && node.name) {
      onUpdate(node.name, editValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(node.value || '');
    setIsEditing(false);
  };

  // 渲染值编辑器
  const renderValueEditor = () => {
    if (node.type !== 'symbol') return null;

    const dataType = node.data_type;

    // Boolean/Tristate 类型
    if (dataType === 'bool' || dataType === 'tristate') {
      return (
        <select
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            if (onUpdate && node.name) {
              onUpdate(node.name, e.target.value);
            }
          }}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="n">N (No)</option>
          {dataType === 'tristate' && <option value="m">M (Module)</option>}
          <option value="y">Y (Yes)</option>
        </select>
      );
    }

    // 其他类型 - 可编辑输入
    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button onClick={handleSave} className="text-green-600 hover:text-green-700">
            <Check className="h-4 w-4" />
          </button>
          <button onClick={handleCancel} className="text-red-600 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 font-mono">
          {editValue || <span className="text-gray-400">(未设置)</span>}
        </span>
        <button
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
        >
          编辑
        </button>
      </div>
    );
  };

  return (
    <div className={`${matchesSearch ? 'bg-yellow-50' : ''}`}>
      <div
        className={`flex items-center py-2 px-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
          !node.visible ? 'opacity-50' : ''
        }`}
        style={{ paddingLeft: `${indent + 16}px` }}
      >
        {/* 展开/折叠图标 */}
        {hasChildren && (
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="mr-2 flex-shrink-0"
          >
            {isExpanded || shouldExpand ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        )}

        {/* 配置项信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${matchesSearch ? 'text-blue-700' : 'text-gray-900'} truncate`}>
              {node.prompt || node.name || 'Unknown'}
            </span>
            
            {/* 类型标签 */}
            {node.type && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {node.type}
              </span>
            )}

            {/* 数据类型标签 */}
            {node.data_type && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                {node.data_type}
              </span>
            )}

            {/* 不可见标签 */}
            {!node.visible && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-500">
                隐藏
              </span>
            )}
          </div>

          {/* 帮助文本 */}
          {node.help && (
            <div className="mt-1 flex items-start space-x-1">
              <Info className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600 line-clamp-2">
                {node.help}
              </p>
            </div>
          )}

          {/* 路径 */}
          {node.path && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              {node.path}
            </p>
          )}
        </div>

        {/* 值编辑器 */}
        <div className="ml-4 flex-shrink-0">
          {renderValueEditor()}
        </div>
      </div>

      {/* 子节点 */}
      {hasChildren && (isExpanded || shouldExpand) && (
        <div>
          {node.children.map((child, index) => (
            <ConfigTree
              key={child.name || index}
              node={child}
              onUpdate={onUpdate}
              level={level + 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 辅助函数：检查是否有匹配的子节点
function hasMatchingChildren(node, searchQuery) {
  if (!node.children || !searchQuery) return false;

  const query = searchQuery.toLowerCase();
  
  return node.children.some(child =>
    child.name?.toLowerCase().includes(query) ||
    child.prompt?.toLowerCase().includes(query) ||
    child.help?.toLowerCase().includes(query) ||
    hasMatchingChildren(child, searchQuery)
  );
}

export default ConfigTree;
