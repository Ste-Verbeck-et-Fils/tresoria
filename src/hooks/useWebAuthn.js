import { useCallback, useState } from 'react'
import {
  isWebAuthnSupported,
  registerDevice,
  loginWithWebAuthn,
  resumePendingRegistration,
  hasPendingRegistration,
} from '../services/webauthn.service.js'

export const useWebAuthn = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [error, setError] = useState(null)

  const register = useCallback(async (deviceName) => {
    setIsLoading(true)
    setIsFinalizing(false)
    setError(null)

    try {
      const device = await registerDevice(deviceName, {
        onFinalizing: () => setIsFinalizing(true),
      })
      return device
    } catch (err) {
      const message = err?.message || 'Impossible d\'enregistrer cet appareil. Veuillez réessayer.'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
      setIsFinalizing(false)
    }
  }, [])

  const resumeRegistration = useCallback(async () => {
    if (!hasPendingRegistration()) return null

    setIsLoading(true)
    setIsFinalizing(true)
    setError(null)

    try {
      const device = await resumePendingRegistration()
      return device
    } catch (err) {
      const message = err?.message || 'Impossible de finaliser l\'enregistrement. Veuillez réessayer.'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
      setIsFinalizing(false)
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
    resumeRegistration,
    login,
    isLoading,
    isFinalizing,
    error,
    isSupported: isWebAuthnSupported(),
    hasPendingRegistration: hasPendingRegistration(),
  }
}
