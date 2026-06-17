import api from './api'

const BASE_URL = '/api/dashboard'

export const dashboardService = {
  getKpis: async (params) => {
    const response = await api.get(`${BASE_URL}/kpis`, { params })
    return response.data
  },

  getCashFlow: async (params) => {
    const response = await api.get(`${BASE_URL}/cash-flow`, { params })
    return response.data
  },

  getExpensesByCategory: async (params) => {
    const response = await api.get(`${BASE_URL}/expenses-by-category`, { params })
    return response.data
  },

  getRecentOperations: async (params) => {
    const response = await api.get(`${BASE_URL}/recent-operations`, { params })
    return response.data
  },

  getAnomalies: async (params) => {
    const response = await api.get(`${BASE_URL}/anomalies`, { params })
    return response.data
  }
}
