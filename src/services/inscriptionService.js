import api from './api.js'
import {
  mockAdresses,
  mockAnneesScolaires,
  mockInscriptions,
  mockParents,
  mockStudents,
} from '../modules/inscriptions/data/mockData.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

const USE_STATIC_DATA = import.meta.env.VITE_USE_STATIC_INSCRIPTION_DATA !== 'false'
const STATIC_DELAY = 250

const clone = (value) => JSON.parse(JSON.stringify(value))

const getAnneeScolaire = (id) => mockAnneesScolaires.find((annee) => annee.id === Number(id))

const getStudent = (id) => mockStudents.find((student) => student.id === Number(id))

const enrichInscription = (inscription) => ({
  ...inscription,
  student: getStudent(inscription.student_id),
  annee_scolaire: getAnneeScolaire(inscription.annee_scolaire_id),
})

const getStaticData = (value) => new Promise((resolve) => {
  window.setTimeout(() => resolve(clone(value)), STATIC_DELAY)
})

const getStaticInscription = (id) => {
  const inscription = mockInscriptions.find((item) => item.id === Number(id))

  if (!inscription) {
    return Promise.reject(new Error('Inscription introuvable.'))
  }

  return getStaticData(enrichInscription(inscription))
}

const createStaticInscription = (payload) => {
  const nextId = Math.max(...mockInscriptions.map((item) => item.id), 0) + 1
  const now = new Date().toISOString()
  const inscription = {
    id: nextId,
    student_id: payload.student_id,
    class_id: payload.class_id,
    annee_scolaire_id: payload.annee_scolaire_id,
    statut: 'ACTIF',
    created_at: now,
    updated_at: now,
  }

  mockInscriptions.push(inscription)

  return getStaticData({ inscription: enrichInscription(inscription) })
}

export const getInscriptions = () => (
  USE_STATIC_DATA
    ? getStaticData(mockInscriptions.map(enrichInscription))
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

export const getAnneesScolaires = () => (
  USE_STATIC_DATA ? getStaticData(mockAnneesScolaires) : getData(api.get('/api/annees-scolaires'))
)

export const getParents = () => (
  USE_STATIC_DATA ? getStaticData(mockParents) : getData(api.get('/api/parents'))
)

export const getStudents = () => (
  USE_STATIC_DATA ? getStaticData(mockStudents) : getData(api.get('/api/students'))
)

export const getAdresses = () => (
  USE_STATIC_DATA ? getStaticData(mockAdresses) : getData(api.get('/api/adresses'))
)
