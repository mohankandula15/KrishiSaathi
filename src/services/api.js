// KrishiSaathi Frontend API Client
// Connects React frontend to FastAPI + Supabase backend

const API_BASE_URL = 'http://localhost:8000/api';

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

    if (!response.ok) {
      throw new Error(data.detail || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.warn(`API call to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
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
    send: (message, language) => request('/chat/send', {
      method: 'POST',
      body: { message, language: language || undefined },
    }),
    clear: () => request('/chat/history', {
      method: 'DELETE',
    }),
  },
};
