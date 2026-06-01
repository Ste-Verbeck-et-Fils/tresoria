export const GENDER_OPTIONS = [
  { value: 'MASCULIN', label: 'Masculin' },
  { value: 'FEMININ', label: 'Feminin' },
]

export const normalizeParentForm = (parent = {}) => ({
  full_name: parent.full_name || '',
  phone: parent.phone || '',
  gender: parent.gender || '',
  profession: parent.profession || '',
})

export const normalizeAdresseForm = (adresse = {}) => ({
  commune: adresse.commune || '',
  quartier: adresse.quartier || '',
  avenue: adresse.avenue || '',
  numero: adresse.numero || '',
})

export const unwrapParent = (payload) => (
  payload?.parent ?? payload?.data?.parent ?? payload?.data ?? payload ?? null
)

export const unwrapAdresse = (payload) => (
  payload?.adresse ?? payload?.data?.adresse ?? payload?.data ?? payload ?? null
)

export const validateParentForm = (form) => {
  const errors = {}

  if (!form.full_name.trim()) {
    errors.full_name = 'Le nom complet est obligatoire.'
  }

  if (!form.phone.trim()) {
    errors.phone = 'Le numero de telephone est obligatoire.'
  }

  return errors
}

export const validateAdresseForm = (form) => {
  const errors = {}

  if (!form.commune.trim()) {
    errors.commune = 'La commune est obligatoire.'
  }

  if (!form.quartier.trim()) {
    errors.quartier = 'Le quartier est obligatoire.'
  }

  if (!form.avenue.trim()) {
    errors.avenue = 'L avenue est obligatoire.'
  }

  return errors
}

export const getParentPayload = (form) => ({
  full_name: form.full_name.trim(),
  phone: form.phone.trim(),
  gender: form.gender || null,
  profession: form.profession.trim() || null,
})

export const getAdressePayload = (form, parentId) => ({
  parent_id: Number(parentId),
  commune: form.commune.trim(),
  quartier: form.quartier.trim(),
  avenue: form.avenue.trim(),
  numero: form.numero.trim() || null,
})
