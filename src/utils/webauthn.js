export const generateWebAuthnCredential = async (userInfo) => {
  const webAuthnSupported = window.isSecureContext && window.PublicKeyCredential
  if (!webAuthnSupported) {
    throw new Error('Votre navigateur ne prend pas en charge l\'authentification biométrique.')
  }

  const clientDataJSON = new TextEncoder().encode(JSON.stringify({
    type: 'webauthn.create',
    challenge: crypto.randomUUID(),
    origin: window.location.origin,
  }))

  const rawId = crypto.getRandomValues(new Uint8Array(32))
  const response = {
    clientDataJSON,
    attestationObject: new Uint8Array(0).buffer,
    transports: ['internal'],
  }

  const credential = {
    id: userInfo?.name || `Device - ${new Date().toLocaleDateString('fr-FR')}`,
    rawId,
    response,
    type: 'public-key',
  }

  return {
    credential_id: btoa(String.fromCharCode(...rawId)),
    public_key: btoa(String.fromCharCode(...new Uint8Array(clientDataJSON))),
    device_name: credential.id,
  }
}
