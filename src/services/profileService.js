import api from './api.js'

export const normalizeProfile = (data = {}) => {
  const profile = data?.user || data

  return {
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    phone_verify: Boolean(profile?.phone_verify),
    photo_url: profile?.photo_url || '',
    role: profile?.role || '',
    statut: profile?.statut || profile?.status || '',
  }
}

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

export const changeUserPassword = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = new Error(await parseErrorMessage(response, 'La modification du mot de passe a echoue.'))
    error.status = response.status
    throw error
  }

  return response.json()
}
