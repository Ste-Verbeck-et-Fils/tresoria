import api from './api'

export const sendBulkSms = async (payload) => {
  const response = await api.post('/api/sms/bulk', payload)
  return response.data
}
