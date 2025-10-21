import axios from 'axios'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api'

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
    
    console.log('Telegram WebApp available:', !!tg)
    console.log('initData available:', !!initData)
    
    if (initData) {
      config.headers['x-telegram-initdata'] = initData
      console.log('Added initData to headers')
    } else {
      // Fallback for development/testing
      console.log('No initData available, using fallback')
      config.headers['x-telegram-initdata'] = 'dev-fallback'
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
  // If data is FormData, ensure axios handles Content-Type automatically
  if (data instanceof FormData) {
    console.log('📤 Sending FormData with', data.get('file')?.name || 'unknown file')
    // Don't merge headers if uploading file - let axios set Content-Type
    return http.post(url, data, config).then((r) => r.data)
  }
  return http.post(url, data, config).then((r) => r.data)
}

export function put(url, data, config) {
  return http.put(url, data, config).then((r) => r.data)
}

export function patch(url, data, config) {
  return http.patch(url, data, config).then((r) => r.data)
}

export function del(url, config) {
  return http.delete(url, config).then((r) => r.data)
}


