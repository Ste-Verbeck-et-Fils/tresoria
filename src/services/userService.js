import api from './api'

const getData = async (request) => {
  const response = await request
  return response.data
}

export const getUsers = () => getData(api.get('/api/admin/users'))

export const getUserById = (id) => getData(api.get(`/api/admin/users/${id}`))

export const createUser = (payload) => getData(api.post('/api/admin/users', payload))

export const updateUser = (id, payload) => getData(api.patch(`/api/admin/users/${id}`, payload))

export const deleteUser = (id) => getData(api.delete(`/api/admin/users/${id}`))

export const resetUserPassword = (id) => getData(api.post(`/api/admin/users/${id}/reset-password`))
