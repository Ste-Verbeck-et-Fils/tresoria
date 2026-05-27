import api from './api.js'

export const registerUser = async (payload) => {
  const response = await api.post('/api/auth/register', payload)
  return response.data
}

export const loginUser = async (payload) => {
  const response = await api.post('/api/auth/login', payload)
  return response.data
}

export const logoutUser = async () => {
  const response = await api.post('/api/auth/logout')
  return response.data
}

// Les routes de reset/forgot password peuvent être ajoutées ici aussi
export const forgotPassword = async (payload) => {
  const response = await api.post('/api/auth/forgot-password', payload)
  return response.data
}

export const verifyOtp = async (payload) => {
  const response = await api.post('/api/auth/verify-otp', payload)
  return response.data
}

export const resetPassword = async (payload) => {
  const response = await api.post('/api/auth/reset-password', payload)
  return response.data
}
