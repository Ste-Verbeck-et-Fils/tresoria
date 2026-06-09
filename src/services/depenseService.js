import api from './api.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '')
)

export const getDepenses = (params = {}) => getData(api.get('/api/depenses', {
  params: cleanParams(params),
}))

export const getDepense = (id) => getData(api.get(`/api/depenses/${id}`))

export const getAnneeScolaireDepenses = (anneeScolaireId) => (
  getData(api.get(`/api/depenses/annee-scolaire/${anneeScolaireId}`))
)

export const createDepense = (payload) => getData(api.post('/api/depenses', payload))

export const updateDepense = (id, payload) => getData(api.patch(`/api/depenses/${id}`, payload))

export const updateDepenseStatutCheque = (id, payload) => getData(api.patch(`/api/depenses/${id}/statut-cheque`, payload))

export const annulerDepense = (id) => getData(api.patch(`/api/depenses/${id}/annuler`))

export const deleteDepense = (id) => getData(api.delete(`/api/depenses/${id}`))
