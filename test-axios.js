import axios from 'axios'

const FormData = (await import('formdata-node')).FormData || globalThis.FormData;
const api = axios.create({
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  console.log("Axios headers with FormData:", config.headers['Content-Type'])
  return config
})

try {
  await api.post('http://localhost:9999', new FormData())
} catch (e) {}
