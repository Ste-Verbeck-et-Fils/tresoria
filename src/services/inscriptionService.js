import api from './api.js'
import { mockInscriptions } from '../modules/inscriptions/data/mockData.js'

export { getAnneesScolaires } from './anneeScolaireService.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

const USE_STATIC_DATA = import.meta.env.VITE_USE_STATIC_INSCRIPTION_DATA !== 'false'
const STATIC_DELAY = 250

const clone = (value) => JSON.parse(JSON.stringify(value))

const getStaticData = (value) => new Promise((resolve) => {
  window.setTimeout(() => resolve(clone(value)), STATIC_DELAY)
})

const getStaticInscription = (id) => {
  const inscription = mockInscriptions.find((item) => item.id === Number(id))

  if (!inscription) {
    return Promise.reject(new Error('Inscription introuvable.'))
  }

  return getStaticData(inscription)
}

const createStaticInscription = (payload) => {
  const nextId = Math.max(...mockInscriptions.map((item) => item.id), 0) + 1
  const now = new Date().toISOString()
  const inscription = {
    id: nextId,
    student_id: payload.student_id,
    class_id: payload.class_id,
    annee_scolaire_id: payload.annee_scolaire_id,
    parent_id: payload.parent_id || null,
    statut: 'ACTIF',
    created_at: now,
    updated_at: now,
  }

  mockInscriptions.push(inscription)

  return getStaticData({ inscription })
}

export const getInscriptions = () => (
  USE_STATIC_DATA
    ? getStaticData(mockInscriptions)
    : getData(api.get('/api/inscriptions'))
)

export const getInscription = (id) => (
  USE_STATIC_DATA
    ? getStaticInscription(id)
    : getData(api.get(`/api/inscriptions/${id}`))
)

export const createInscription = (payload) => (
  USE_STATIC_DATA
    ? createStaticInscription(payload)
    : getData(api.post('/api/inscriptions', payload))
)
