import {
  getParentAdressePayload,
  normalizeAdresseForm,
  validateAdresseForm,
} from '../../inscriptions/utils/adresse'

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

export {
  normalizeAdresseForm,
  validateAdresseForm,
}

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

  if (!form.gender) {
    errors.gender = 'Le genre est obligatoire.'
  }

  if (!form.profession.trim()) {
    errors.profession = 'La profession est obligatoire.'
  }

  return errors
}

export const getParentPayload = (form) => ({
  full_name: form.full_name.trim(),
  phone: form.phone.trim() || null,
  gender: form.gender,
  profession: form.profession.trim(),
})

export const getAdressePayload = getParentAdressePayload
