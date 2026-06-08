import api from './api.js'

export const getDevices = async () => {
  const response = await api.get('/api/auth/devices')
  return response.data?.data || response.data
}

export const createDevice = async (payload) => {
  const response = await api.post('/api/auth/devices', payload)
  return response.data?.data || response.data
}

export const deleteDevice = async (id) => {
  const response = await api.delete(`/api/auth/devices/${id}`)
  return response.data?.data || response.data
}

export const updateDeviceStatus = async (id, status) => {
  const response = await api.patch(`/api/auth/devices/${id}/status`, { status })
  const payload = response.data?.data || response.data
  return payload?.device || payload
}
