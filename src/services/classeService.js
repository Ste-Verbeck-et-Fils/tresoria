import api from './api.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

export const getClasses = () => getData(api.get('/api/classes'))

export const getClasse = (id) => getData(api.get(`/api/classes/${id}`))

export const createClasse = (payload) => getData(api.post('/api/classes', payload))

export const updateClasse = (id, payload) => getData(api.patch(`/api/classes/${id}`, payload))

export const deleteClasse = (id) => getData(api.delete(`/api/classes/${id}`))
