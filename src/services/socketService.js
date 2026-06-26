import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://gsemmanuel-api.kozow.com'

let socket

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true
    })

    socket.on('connect', () => {
      console.log('Connecté au serveur WebSocket :', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('Déconnecté du serveur WebSocket')
    })
  }

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
