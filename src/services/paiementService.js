import api from './api.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '')
)

export const getPaiements = (params = {}) => getData(api.get('/api/paiements', {
  params: cleanParams(params),
}))

export const getPaiement = (id) => getData(api.get(`/api/paiements/${id}`))

export const getInscriptionPaiements = (inscriptionId) => (
  getData(api.get(`/api/paiements/inscription/${inscriptionId}`))
)

export const createPaiement = (payload) => getData(api.post('/api/paiements', payload))

export const createParentPaiement = (payload) => getData(api.post('/api/paiements/parent', payload))

export const updatePaiement = (id, payload) => getData(api.patch(`/api/paiements/${id}`, payload))

export const annulerPaiement = (id) => getData(api.patch(`/api/paiements/${id}/annuler`))

export const deletePaiement = (id) => getData(api.delete(`/api/paiements/${id}`))

export const regulariserPaiement = (id) => getData(api.post(`/api/paiements/${id}/regulariser`))
export const validerPaiement = (id) => getData(api.post(`/api/paiements/${id}/valider`))
