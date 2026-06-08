import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import {
  fetchRegisterOptions,
  verifyRegisterResponse,
  fetchLoginOptions,
  verifyLoginResponse,
} from '../api/webauthn.api.js'

export const isWebAuthnSupported = () => {
  return Boolean(window.isSecureContext && window.PublicKeyCredential)
}

const mapWebAuthnError = (error) => {
  if (!error) {
    return new Error('Une erreur est survenue. Veuillez réessayer.')
  }

  if (error.name === 'NotAllowedError') {
    return new Error('Opération annulée. Veuillez réessayer.')
  }

  if (error.name === 'InvalidStateError') {
    return new Error('Cet appareil est déjà enregistré.')
  }

  if (error.name === 'SecurityError' || error.name === 'NotSupportedError') {
    return new Error('Votre navigateur ne prend pas en charge l\'authentification biométrique.')
  }

  if (error.message) {
    return error
  }

  return new Error('Une erreur est survenue. Veuillez réessayer.')
}

export const registerDevice = async (deviceName) => {
  if (!isWebAuthnSupported()) {
    throw new Error('Votre navigateur ne prend pas en charge l\'authentification biométrique.')
  }

  const optionsResponse = await fetchRegisterOptions()
  const options = optionsResponse?.data?.options

  if (!options) {
    throw new Error('Impossible d\'enregistrer cet appareil. Veuillez réessayer.')
  }

  let attestationResponse
  try {
    attestationResponse = await startRegistration({ optionsJSON: options })
  } catch (error) {
    throw mapWebAuthnError(error)
  }

  try {
    const result = await verifyRegisterResponse({
      ...attestationResponse,
      device_name: deviceName?.trim() || undefined,
    })
    return result?.data?.device || result?.device
  } catch (error) {
    throw mapWebAuthnError(error)
  }
}

export const loginWithWebAuthn = async ({ phone } = {}) => {
  if (!isWebAuthnSupported()) {
    throw new Error('Votre navigateur ne prend pas en charge l\'authentification biométrique.')
  }

  const optionsResponse = await fetchLoginOptions(
    phone ? { phone: phone.trim() } : {}
  )
  const options = optionsResponse?.data?.options

  if (!options) {
    throw new Error('Connexion biométrique impossible. Veuillez réessayer.')
  }

  let assertionResponse
  try {
    assertionResponse = await startAuthentication({ optionsJSON: options })
  } catch (error) {
    throw mapWebAuthnError(error)
  }

  try {
    const result = await verifyLoginResponse(assertionResponse)
    return result
  } catch (error) {
    throw mapWebAuthnError(error)
  }
}
