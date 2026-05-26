const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export const normalizeProfile = (data = {}) => ({
  full_name: data?.full_name || '',
  phone: data?.phone || '',
  phone_verify: Boolean(data?.phone_verify),
  photo_url: data?.photo_url || '',
  role: data?.role || '',
  statut: data?.statut || data?.status || '',
})

const getAuthHeaders = () => {
  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token')

  return token ? { Authorization: `Bearer ${token}` } : {}
}

const parseErrorMessage = async (response, fallbackMessage) => {
  try {
    const data = await response.json()
    return data?.message || data?.error || fallbackMessage
  } catch {
    return fallbackMessage
  }
}

export const getUserProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = new Error(await parseErrorMessage(response, 'Impossible de charger le profil.'))
    error.status = response.status
    throw error
  }

  return response.json()
}

export const updateUserProfile = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
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
    const error = new Error(await parseErrorMessage(response, 'La mise a jour du profil a echoue.'))
    error.status = response.status
    throw error
  }

  return response.json()
}

export const updateUserProfileFormData = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    const error = new Error(await parseErrorMessage(response, 'La mise a jour de la photo a echoue.'))
    error.status = response.status
    throw error
  }

  return response.json()
}
