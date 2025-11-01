import axios from 'axios';

const API_BASE_URL =
  (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      // 处理速率限制
      const retryAfter = error.response.headers['retry-after'] || 60;
      console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
    }
    return Promise.reject(error);
  }
);

// 会话管理API
export const sessionAPI = {
  // 创建会话
  createSession: (version = 'master') => {
    return api.post('/session', { version });
  },

  // 获取会话信息
  getSession: (sessionId) => {
    return api.get(`/session/${sessionId}`);
  },

  // 删除会话
  deleteSession: (sessionId) => {
    return api.delete(`/session/${sessionId}`);
  },

  // 获取配置树
  getConfigTree: (sessionId) => {
    return api.get(`/session/${sessionId}/tree`);
  },

  // 添加自定义feed
  addFeed: (sessionId, feedData) => {
    return api.post(`/session/${sessionId}/feeds`, feedData);
  },

  // 获取统计信息
  getStats: () => {
    return api.get('/session/stats');
  },
};

// 配置管理API
export const configAPI = {
  // 更新符号值
  updateSymbol: (sessionId, symbolName, value) => {
    return api.put(`/session/${sessionId}/symbol/${symbolName}`, { value });
  },

  // 上传配置文件
  uploadConfig: (sessionId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/session/${sessionId}/config/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 下载完整配置
  downloadConfig: (sessionId) => {
    return api.get(`/session/${sessionId}/config/download`, {
      responseType: 'blob',
    });
  },

  // 下载最小配置
  downloadDiffConfig: (sessionId) => {
    return api.get(`/session/${sessionId}/diffconfig/download`, {
      responseType: 'blob',
    });
  },

  // 搜索符号
  searchSymbols: (sessionId, query, limit = 50) => {
    return api.get(`/session/${sessionId}/search`, {
      params: { q: query, limit },
    });
  },

  // 比较配置
  compareConfigs: (sessionId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/session/${sessionId}/compare`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;