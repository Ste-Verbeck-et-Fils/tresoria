import api from './api.js'
import {
  createAdresse,
  deleteAdresse,
  getStudentAdresses,
  updateAdresse,
} from './adresseService.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

export const getStudents = () => getData(api.get('/api/students'))

export const getStudent = (id) => getData(api.get(`/api/students/${id}`))

export const createStudent = (payload) => getData(api.post('/api/students', payload))

export const updateStudent = (id, payload) => getData(api.patch(`/api/students/${id}`, payload))

export const deleteStudent = (id) => getData(api.delete(`/api/students/${id}`))

export {
  createAdresse,
  deleteAdresse,
  getStudentAdresses,
  updateAdresse,
}
