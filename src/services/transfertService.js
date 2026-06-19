import api from './api.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '')
)

export const getTransferts = (params = {}) => getData(api.get('/api/transferts', {
  params: cleanParams(params),
}))

export const getTransfertById = (id) => getData(api.get(`/api/transferts/${id}`))

export const createTransfert = (payload) => getData(api.post('/api/transferts', payload))

export const annulerTransfert = (id) => getData(api.put(`/api/transferts/${id}/annuler`))

export const regulariserTransfert = (id) => getData(api.post(`/api/transferts/${id}/regulariser`))
export const validerTransfert = (id) => getData(api.post(`/api/transferts/${id}/valider`))
export const updateTransfert = (id, payload) => getData(api.put(`/api/transferts/${id}`, payload))
