// KrishiSaathi Frontend API Client
// Connects React frontend to FastAPI + Supabase backend

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeader() {
  const token = localStorage.getItem('krishisaathi_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeader(),
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => ({}));

    // On any 401 response, clear token & user and redirect to login
    if (response.status === 401) {
      localStorage.removeItem('krishisaathi_token');
      localStorage.removeItem('krishisaathi_user');

      const isLoginEndpoint = endpoint === '/auth/login';
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');

      if (!isLoginEndpoint && !isLoginPage && typeof window !== 'undefined') {
        const message = 'Session expired, please log in again';
        sessionStorage.setItem('login_message', message);
        window.location.href = `/login?message=${encodeURIComponent(message)}`;
      }

      const err = new Error(data.detail || 'Session expired, please log in again');
      err.status = 401;
      err.data = data;
      throw err;
    }

    if (!response.ok) {
      const err = new Error(data.detail || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      err.isNetworkError = true;
    }
    console.warn(`API call to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  // Wake-up / Health check
  health: () => {
    const endpoint = API_BASE_URL.replace(/\/+$/, '').endsWith('/api') ? '/health' : '/api/health';
    return request(endpoint);
  },
  // Auth endpoints
  auth: {
    login: async (mobile_number, password) => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: { mobile_number, password },
      });
      if (res?.access_token) {
        localStorage.setItem('krishisaathi_token', res.access_token);
      }
      return res;
    },
    register: async (farmerData) => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: farmerData,
      });
      if (res?.access_token) {
        localStorage.setItem('krishisaathi_token', res.access_token);
      }
      return res;
    },
    getMe: () => request('/auth/me'),
  },

  // Farmer profile
  farmers: {
    getProfile: () => request('/farmers/profile'),
    updateProfile: (data) => request('/farmers/profile', {
      method: 'PUT',
      body: data,
    }),
  },

  // Soil reports
  soilReports: {
    getAll: () => request('/soil-reports/'),
    getById: (id) => request(`/soil-reports/${id}`),
    create: (data) => request('/soil-reports/', {
      method: 'POST',
      body: data,
    }),
    extract: (formData) => request('/soil-reports/extract', {
      method: 'POST',
      body: formData,
    }),
    confirm: (reportData) => request('/soil-reports/confirm', {
      method: 'POST',
      body: reportData,
    }),
    upload: (formData) => request('/soil-reports/upload', {
      method: 'POST',
      body: formData,
    }),
    delete: (id) => request(`/soil-reports/${id}`, {
      method: 'DELETE',
    }),
  },

  // Recommendations
  recommendations: {
    getAll: () => request('/recommendations/'),
    getByReportId: (reportId) => request(`/recommendations/report/${reportId}`),
    calculateFertilizer: (payload) => request('/recommendations/calculate-fertilizer', {
      method: 'POST',
      body: payload,
    }),
    calculateCrops: (payload) => request('/recommendations/calculate-crops', {
      method: 'POST',
      body: payload,
    }),
    getSupportedCrops: () => request('/recommendations/supported-crops'),
  },

  // Chat conversation history
  chat: {
    getHistory: () => request('/chat/history'),
    send: (message, language, options = {}) => request('/chat/send', {
      method: 'POST',
      body: { message, language: language || undefined },
      ...options,
    }),
    clear: () => request('/chat/history', {
      method: 'DELETE',
    }),
    getTTSAudio: async (text, lang) => {
      const url = `${API_BASE_URL}/chat/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang || 'te')}`;
      const token = localStorage.getItem('krishisaathi_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const err = new Error(`TTS synthesis failed with status ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return await res.blob();
    },
  },
};
