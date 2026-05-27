import api from './api.js'

export const normalizeProfile = (data = {}) => ({
  full_name: data?.full_name || '',
  phone: data?.phone || '',
  phone_verify: Boolean(data?.phone_verify),
  photo_url: data?.photo_url || '',
  role: data?.role || '',
  statut: data?.statut || data?.status || '',
})

export const getUserProfile = async () => {
  const response = await api.get('/api/users/profile')
  return response.data
}

export const updateUserProfile = async (payload) => {
  const response = await api.patch('/api/users/profile', payload)
  return response.data
}

export const changeUserPassword = async (payload) => {
  const response = await api.patch('/api/users/change-password', payload)
  return response.data
}

export const updateUserProfileFormData = async (formData) => {
  const response = await api.patch('/api/users/profile', formData, {
    headers: {
      // Axios définira automatiquement le bon Content-Type multipart/form-data avec le boundary
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}
