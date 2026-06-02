import api from './api.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

export const getAdresses = () => getData(api.get('/api/adresses'))

export const getAdresse = (id) => getData(api.get(`/api/adresses/${id}`))

export const getParentAdresses = (parentId) => getData(api.get(`/api/adresses/parent/${parentId}`))

export const getStudentAdresses = (studentId) => getData(api.get(`/api/adresses/student/${studentId}`))

export const createAdresse = (payload) => getData(api.post('/api/adresses', payload))

export const updateAdresse = (id, payload) => getData(api.patch(`/api/adresses/${id}`, payload))

export const deleteAdresse = (id) => getData(api.delete(`/api/adresses/${id}`))
