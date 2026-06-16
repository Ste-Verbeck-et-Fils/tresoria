import api from './api.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

export const getComptesTresorerie = () => getData(api.get('/api/tresorerie/comptes'))
