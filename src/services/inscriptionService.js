import api from './api.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

export const getInscriptions = () => getData(api.get('/api/inscriptions'))

export const getInscription = (id) => getData(api.get(`/api/inscriptions/${id}`))

export const getStudentInscriptions = (studentId) => (
  getData(api.get(`/api/inscriptions/student/${studentId}`))
)

export const getClasseInscriptions = (classId) => (
  getData(api.get(`/api/inscriptions/classe/${classId}`))
)

export const getAnneeScolaireInscriptions = (anneeScolaireId) => (
  getData(api.get(`/api/inscriptions/annee-scolaire/${anneeScolaireId}`))
)

export const createInscription = (payload) => getData(api.post('/api/inscriptions', payload))

export const updateInscriptionStatut = (id, statut) => (
  getData(api.patch(`/api/inscriptions/${id}/statut`, { statut }))
)

export const deleteInscription = (id) => getData(api.delete(`/api/inscriptions/${id}`))
