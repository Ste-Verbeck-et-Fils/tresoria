import api from './api.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

export const getAnneesScolaires = () => getData(api.get('/api/annees-scolaires'))

export const getAnneeScolaire = (id) => getData(api.get(`/api/annees-scolaires/${id}`))

export const getAnneeScolaireActive = () => getData(api.get('/api/annees-scolaires/active'))

export const createAnneeScolaire = (payload) => getData(api.post('/api/annees-scolaires', payload))

export const updateAnneeScolaire = (id, payload) => (
  getData(api.patch(`/api/annees-scolaires/${id}`, payload))
)

export const cloturerAnneeScolaire = (id) => (
  getData(api.patch(`/api/annees-scolaires/${id}/cloturer`))
)

export const deleteAnneeScolaire = (id) => getData(api.delete(`/api/annees-scolaires/${id}`))
