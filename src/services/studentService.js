import api from './api.js'
import {
  createAdresse,
  deleteAdresse,
  updateAdresse,
} from './parentService.js'

const getData = async (request) => {
  const response = await request
  return response.data
}

export const getStudents = () => getData(api.get('/api/students'))

export const getStudent = (id) => getData(api.get(`/api/students/${id}`))

export const createStudent = (payload) => getData(api.post('/api/students', payload))

export const updateStudent = (id, payload) => getData(api.patch(`/api/students/${id}`, payload))

export const deleteStudent = (id) => getData(api.delete(`/api/students/${id}`))

export const getStudentAdresses = (studentId) => getData(api.get(`/api/adresses/student/${studentId}`))

export {
  createAdresse,
  deleteAdresse,
  updateAdresse,
}
