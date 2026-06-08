import api from '../services/api.js'

export const fetchRegisterOptions = async () => {
  const response = await api.post('/api/auth/webauthn/register/options')
  return response.data
}

export const verifyRegisterResponse = async (payload) => {
  const response = await api.post('/api/auth/webauthn/register/verify', payload)
  return response.data
}

export const fetchLoginOptions = async (payload = {}) => {
  const response = await api.post('/api/auth/webauthn/login/options', payload)
  return response.data
}

export const verifyLoginResponse = async (payload) => {
  const response = await api.post('/api/auth/webauthn/login/verify', payload)
  return response.data
}
