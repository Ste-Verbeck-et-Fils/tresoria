import api from './api.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

const normalizeSearchResult = (payload) => {
  const result = payload?.parents ??
    payload?.parent ??
    payload?.data?.parents ??
    payload?.data?.parent ??
    payload?.data ??
    payload

  if (Array.isArray(result)) {
    return result
  }

  return result ? [result] : []
}

export const getParents = () => getData(api.get('/api/parents'))

export const getParent = (id) => getData(api.get(`/api/parents/${id}`))

export const searchParentsByPhone = async (phone) => {
  if (!phone.trim()) {
    return getParents()
  }

  const payload = await getData(api.get('/api/parents/search', { params: { phone: phone.trim() } }))

  return normalizeSearchResult(payload)
}

export const createParent = (payload) => getData(api.post('/api/parents', payload))

export const updateParent = (id, payload) => getData(api.patch(`/api/parents/${id}`, payload))

export const deleteParent = (id) => getData(api.delete(`/api/parents/${id}`))

export const getParentAdresses = (parentId) => getData(api.get(`/api/adresses/parent/${parentId}`))

export const createAdresse = (payload) => getData(api.post('/api/adresses', payload))

export const updateAdresse = (id, payload) => getData(api.patch(`/api/adresses/${id}`, payload))

export const deleteAdresse = (id) => getData(api.delete(`/api/adresses/${id}`))
