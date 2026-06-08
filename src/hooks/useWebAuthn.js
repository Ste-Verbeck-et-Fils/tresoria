import { useCallback, useState } from 'react'
import {
  isWebAuthnSupported,
  registerDevice,
  loginWithWebAuthn,
} from '../services/webauthn.service.js'

export const useWebAuthn = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const register = useCallback(async (deviceName) => {
    setIsLoading(true)
    setError(null)

    try {
      const device = await registerDevice(deviceName)
      return device
    } catch (err) {
      const message = err?.message || 'Impossible d\'enregistrer cet appareil. Veuillez réessayer.'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async ({ phone } = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await loginWithWebAuthn({ phone })
      return result
    } catch (err) {
      const message = err?.message || 'Connexion biométrique impossible. Veuillez réessayer.'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    register,
    login,
    isLoading,
    error,
    isSupported: isWebAuthnSupported(),
  }
}
