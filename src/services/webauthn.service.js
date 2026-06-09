import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import {
  fetchRegisterOptions,
  verifyRegisterResponse,
  fetchLoginOptions,
  verifyLoginResponse,
} from '../api/webauthn.api.js'

const PENDING_REGISTRATION_KEY = 'tresoria_webauthn_pending_registration'
const PENDING_TTL_MS = 15 * 60 * 1000

let registrationInProgress = false

export const isWebAuthnSupported = () => {
  return Boolean(window.isSecureContext && window.PublicKeyCredential)
}

const mapWebAuthnError = (error) => {
  if (!error) {
    return new Error('Une erreur est survenue. Veuillez réessayer.')
  }

  if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
    return new Error('Opération annulée. Veuillez réessayer.')
  }

  if (error.name === 'InvalidStateError') {
    return new Error('Cet appareil est déjà enregistré.')
  }

  if (error.status) {
    return error
  }

  if (error.name === 'SecurityError' || error.name === 'NotSupportedError') {
    return new Error('Votre navigateur ne prend pas en charge l\'authentification biométrique.')
  }

  if (error.message) {
    return error
  }

  return new Error('Une erreur est survenue. Veuillez réessayer.')
}

const buildRegistrationPayload = (attestationResponse, deviceName) => ({
  id: attestationResponse.id,
  rawId: attestationResponse.rawId,
  type: attestationResponse.type,
  response: attestationResponse.response,
  clientExtensionResults: attestationResponse.clientExtensionResults,
  authenticatorAttachment: attestationResponse.authenticatorAttachment,
  device_name: deviceName?.trim() || undefined,
})

const savePendingRegistration = (attestationResponse, deviceName) => {
  sessionStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify({
    attestationResponse,
    deviceName: deviceName?.trim() || '',
    savedAt: Date.now(),
  }))
}

const clearPendingRegistration = () => {
  sessionStorage.removeItem(PENDING_REGISTRATION_KEY)
}

const getPendingRegistration = () => {
  const raw = sessionStorage.getItem(PENDING_REGISTRATION_KEY)
  if (!raw) return null

  try {
    const pending = JSON.parse(raw)
    if (!pending?.attestationResponse || Date.now() - pending.savedAt > PENDING_TTL_MS) {
      clearPendingRegistration()
      return null
    }
    return pending
  } catch {
    clearPendingRegistration()
    return null
  }
}

const warnBeforeUnload = (event) => {
  event.preventDefault()
  event.returnValue = ''
}

const enableUnloadWarning = () => {
  window.addEventListener('beforeunload', warnBeforeUnload)
}

const disableUnloadWarning = () => {
  window.removeEventListener('beforeunload', warnBeforeUnload)
}

const submitRegistrationVerification = async (attestationResponse, deviceName) => {
  const result = await verifyRegisterResponse(
    buildRegistrationPayload(attestationResponse, deviceName)
  )

  const device = result?.data?.device || result?.device
  if (!device) {
    throw new Error('Impossible d\'enregistrer cet appareil. Veuillez réessayer.')
  }

  clearPendingRegistration()
  return device
}

export const resumePendingRegistration = async () => {
  const pending = getPendingRegistration()
  if (!pending) return null

  if (registrationInProgress) return null

  registrationInProgress = true
  enableUnloadWarning()

  try {
    return await submitRegistrationVerification(
      pending.attestationResponse,
      pending.deviceName
    )
  } catch (error) {
    throw mapWebAuthnError(error)
  } finally {
    registrationInProgress = false
    disableUnloadWarning()
  }
}

export const hasPendingRegistration = () => {
  return Boolean(getPendingRegistration())
}

export const registerDevice = async (deviceName, { onFinalizing } = {}) => {
  if (registrationInProgress) {
    throw new Error('Un enregistrement est déjà en cours. Veuillez patienter.')
  }

  if (!isWebAuthnSupported()) {
    throw new Error('Votre navigateur ne prend pas en charge l\'authentification biométrique.')
  }

  registrationInProgress = true
  enableUnloadWarning()

  try {
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

    savePendingRegistration(attestationResponse, deviceName)
    onFinalizing?.()

    return await submitRegistrationVerification(attestationResponse, deviceName)
  } catch (error) {
    throw mapWebAuthnError(error)
  } finally {
    registrationInProgress = false
    disableUnloadWarning()
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
    const result = await verifyLoginResponse({
      id: assertionResponse.id,
      rawId: assertionResponse.rawId,
      type: assertionResponse.type,
      response: assertionResponse.response,
      clientExtensionResults: assertionResponse.clientExtensionResults,
      authenticatorAttachment: assertionResponse.authenticatorAttachment,
    })
    return result
  } catch (error) {
    throw mapWebAuthnError(error)
  }
}
