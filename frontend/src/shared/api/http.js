import axios from 'axios'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const http = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000,
})

// Request interceptor (auth headers, etc.)
http.interceptors.request.use(
  (config) => {
    // Attach Telegram initData for backend guard
    const tg = window.Telegram?.WebApp
    const initData = tg?.initData
    if (initData) {
      config.headers['x-telegram-initdata'] = initData
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor (errors normalization)
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const err = {
      status: error.response?.status || 0,
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Unknown error',
      data: error.response?.data,
    }
    return Promise.reject(err)
  },
)

export function get(url, config) {
  return http.get(url, config).then((r) => r.data)
}

export function post(url, data, config) {
  return http.post(url, data, config).then((r) => r.data)
}

export function put(url, data, config) {
  return http.put(url, data, config).then((r) => r.data)
}

export function del(url, config) {
  return http.delete(url, config).then((r) => r.data)
}


