import api from './api.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '')
)

export const getTresorerie = () => getData(api.get('/api/tresorerie'))

export const getTresorerieAnneeScolaire = (anneeScolaireId) => (
  getData(api.get(`/api/tresorerie/annee-scolaire/${anneeScolaireId}`))
)

export const getTresoreriePeriode = (params = {}) => getData(api.get('/api/tresorerie/periode', {
  params: cleanParams(params),
}))

export const getTresorerieResume = () => getData(api.get('/api/tresorerie/resume'))

export const getRapportFinancierAnneeScolaire = (anneeScolaireId) => (
  getData(api.get(`/api/tresorerie/rapport/annee-scolaire/${anneeScolaireId}`))
)
