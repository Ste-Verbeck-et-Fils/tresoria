import api from './api'

export const getJournal = async (params = {}) => {
  const { data } = await api.get('/api/comptabilite/journal', { params })
  return data
}

export const getBilan = async (params = {}) => {
  const { data } = await api.get('/api/comptabilite/bilan', { params })
  return data
}

export const getBalance = async (params = {}) => {
  const { data } = await api.get('/api/comptabilite/balance', { params })
  return data
}

export const getGrandLivre = async (params = {}) => {
  const { data } = await api.get('/api/comptabilite/grand-livre', { params })
  return data
}
