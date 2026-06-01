import api from './api.js'
import {
  mockAdresses,
  mockInscriptions,
  mockStudents,
} from '../modules/inscriptions/data/mockData.js'
import {
  createParent as createApiParent,
  getParents as getApiParents,
  searchParentsByPhone as searchApiParentsByPhone,
} from './parentService.js'

const USE_STATIC_DATA = import.meta.env.VITE_USE_STATIC_STUDENTS_DATA !== 'false'
const STATIC_DELAY = 250

const clone = (value) => JSON.parse(JSON.stringify(value))

const getData = async (request) => {
  const response = await request
  return response.data
}

const getStaticData = (value) => new Promise((resolve) => {
  window.setTimeout(() => resolve(clone(value)), STATIC_DELAY)
})

const getStaticError = (message) => Promise.reject(new Error(message))

const getNextId = (items) => Math.max(...items.map((item) => item.id), 0) + 1

const mockStudentParents = [
  { id: 1, full_name: 'Jean Mukendi', phone: '+243810000001', gender: 'MASCULIN', profession: 'Commercant' },
  { id: 2, full_name: 'Esther Mukendi', phone: '+243810000002', gender: 'FEMININ', profession: 'Enseignante' },
  { id: 3, full_name: 'Patrick Ilunga', phone: '+243810000003', gender: 'MASCULIN', profession: 'Technicien' },
  { id: 4, full_name: 'Grace Ilunga', phone: '+243810000004', gender: 'FEMININ', profession: 'Infirmiere' },
]

const normalizePhone = (phone = '') => String(phone).replace(/\D/g, '')

const findStudentIndex = (id) => mockStudents.findIndex((student) => student.id === Number(id))

const findAdresseIndex = (id) => mockAdresses.findIndex((adresse) => adresse.id === Number(id))

const getStaticStudent = (id) => {
  const student = mockStudents.find((item) => item.id === Number(id))

  return student
    ? getStaticData({ student })
    : getStaticError('Eleve introuvable.')
}

const createStaticStudent = (payload) => {
  const student = {
    id: getNextId(mockStudents),
    ...payload,
  }

  mockStudents.push(student)

  return getStaticData({ student })
}

const updateStaticStudent = (id, payload) => {
  const studentIndex = findStudentIndex(id)

  if (studentIndex === -1) {
    return getStaticError('Eleve introuvable.')
  }

  mockStudents[studentIndex] = {
    ...mockStudents[studentIndex],
    ...payload,
  }

  return getStaticData({ student: mockStudents[studentIndex] })
}

const deleteStaticStudent = (id) => {
  const studentIndex = findStudentIndex(id)

  if (studentIndex === -1) {
    return getStaticError('Eleve introuvable.')
  }

  const hasInscription = mockInscriptions.some((inscription) => inscription.student_id === Number(id))

  if (hasInscription) {
    return getStaticError('Cet eleve possede une inscription et ne peut pas etre supprime.')
  }

  mockStudents.splice(studentIndex, 1)

  for (let index = mockAdresses.length - 1; index >= 0; index -= 1) {
    if (mockAdresses[index].student_id === Number(id)) {
      mockAdresses.splice(index, 1)
    }
  }

  return getStaticData({ message: 'Eleve supprime avec succes.' })
}

const getStaticStudentAdresses = (studentId) => (
  getStaticData(mockAdresses.filter((adresse) => adresse.student_id === Number(studentId)))
)

const createStaticAdresse = (payload) => {
  const student = mockStudents.find((item) => item.id === Number(payload.student_id))

  if (!student) {
    return getStaticError('Eleve introuvable.')
  }

  const now = new Date().toISOString()
  const adresse = {
    id: getNextId(mockAdresses),
    ...payload,
    student_id: Number(payload.student_id),
    created_at: now,
    updated_at: now,
  }

  mockAdresses.push(adresse)

  return getStaticData({ adresse })
}

const updateStaticAdresse = (id, payload) => {
  const adresseIndex = findAdresseIndex(id)

  if (adresseIndex === -1) {
    return getStaticError('Adresse introuvable.')
  }

  mockAdresses[adresseIndex] = {
    ...mockAdresses[adresseIndex],
    ...payload,
    updated_at: new Date().toISOString(),
  }

  return getStaticData({ adresse: mockAdresses[adresseIndex] })
}

const deleteStaticAdresse = (id) => {
  const adresseIndex = findAdresseIndex(id)

  if (adresseIndex === -1) {
    return getStaticError('Adresse introuvable.')
  }

  mockAdresses.splice(adresseIndex, 1)

  return getStaticData({ message: 'Adresse supprimee avec succes.' })
}

const createStaticStudentParent = (payload) => {
  const parent = {
    id: getNextId(mockStudentParents),
    ...payload,
  }

  mockStudentParents.push(parent)

  return getStaticData({ parent })
}

export const getStudents = () => (
  USE_STATIC_DATA ? getStaticData(mockStudents) : getData(api.get('/api/students'))
)

export const getStudent = (id) => (
  USE_STATIC_DATA ? getStaticStudent(id) : getData(api.get(`/api/students/${id}`))
)

export const createStudent = (payload) => (
  USE_STATIC_DATA ? createStaticStudent(payload) : getData(api.post('/api/students', payload))
)

export const updateStudent = (id, payload) => (
  USE_STATIC_DATA ? updateStaticStudent(id, payload) : getData(api.patch(`/api/students/${id}`, payload))
)

export const deleteStudent = (id) => (
  USE_STATIC_DATA ? deleteStaticStudent(id) : getData(api.delete(`/api/students/${id}`))
)

export const getStudentAdresses = (studentId) => (
  USE_STATIC_DATA
    ? getStaticStudentAdresses(studentId)
    : getData(api.get(`/api/adresses/student/${studentId}`))
)

export const createAdresse = (payload) => (
  USE_STATIC_DATA ? createStaticAdresse(payload) : getData(api.post('/api/adresses', payload))
)

export const updateAdresse = (id, payload) => (
  USE_STATIC_DATA ? updateStaticAdresse(id, payload) : getData(api.patch(`/api/adresses/${id}`, payload))
)

export const deleteAdresse = (id) => (
  USE_STATIC_DATA ? deleteStaticAdresse(id) : getData(api.delete(`/api/adresses/${id}`))
)

export const getStudentParents = () => (
  USE_STATIC_DATA ? getStaticData(mockStudentParents) : getApiParents()
)

export const searchStudentParentsByPhone = (phone) => (
  USE_STATIC_DATA
    ? getStaticData(mockStudentParents.filter((parent) => (
      normalizePhone(parent.phone).includes(normalizePhone(phone))
    )))
    : searchApiParentsByPhone(phone)
)

export const createStudentParent = (payload) => (
  USE_STATIC_DATA ? createStaticStudentParent(payload) : createApiParent(payload)
)
