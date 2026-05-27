import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Création de l'instance Axios avec withCredentials activé par défaut
// Cela permet au navigateur d'envoyer et de recevoir le cookie HttpOnly (refresh_token)
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

// Intercepteur de REQUÊTE : Injecter l'access_token si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Intercepteur de RÉPONSE : Gérer l'expiration du token (401) et rafraîchir
api.interceptors.response.use(
  (response) => response, // Si la requête réussit, on retourne la réponse
  async (error) => {
    const originalRequest = error.config

    // Si on reçoit une erreur 401 (Non autorisé) et que ce n'est pas déjà une tentative de retry
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Appeler la route de rafraîchissement (le cookie sera envoyé automatiquement !)
        const refreshResponse = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {}, {
          withCredentials: true
        })

        const newAccessToken = refreshResponse.data.access_token

        if (newAccessToken) {
          // Sauvegarder le nouveau token
          localStorage.setItem('access_token', newAccessToken)

          // Mettre à jour le header de la requête échouée
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

          // Relancer la requête originale
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Le refresh token a expiré ou est invalide, déconnexion forcée
        console.error("Session expirée, veuillez vous reconnecter.", refreshError)
        localStorage.removeItem('access_token')
        localStorage.removeItem('authToken')
        localStorage.removeItem('user') // Si stocké
        // Optionnel : rediriger vers la page de login
        // window.location.href = '/login'
      }
    }

    // Formater l'erreur pour la rendre plus lisible dans les services
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message
    return Promise.reject(new Error(errorMessage))
  }
)

export default api
