export const normalizeAdresseForm = (adresse = {}) => ({
  commune: adresse.commune || '',
  quartier: adresse.quartier || '',
  avenue: adresse.avenue || '',
  numero: adresse.numero || '',
})

export const normalizeOwnedAdresseForm = (adresse = {}) => ({
  ...normalizeAdresseForm(adresse),
  parent_id: adresse.parent_id ?? adresse.parent?.id ?? '',
  student_id: adresse.student_id ?? adresse.student?.id ?? '',
})

export const validateAdresseForm = (form) => {
  const errors = {}

  if (!form.quartier.trim()) {
    errors.quartier = 'Le quartier est obligatoire.'
  }

  return errors
}

export const validateOwnedAdresseForm = (form) => {
  const errors = validateAdresseForm(form)

  if (form.parent_id && form.student_id) {
    errors.owner_id = 'Selectionnez un seul proprietaire.'
  } else if (!form.parent_id && !form.student_id) {
    errors.owner_id = 'Selectionnez un parent ou un eleve.'
  }

  return errors
}

const getAdressePayload = (form) => ({
  commune: form.commune.trim() || null,
  quartier: form.quartier.trim(),
  avenue: form.avenue.trim() || null,
  numero: form.numero.trim() || null,
})

export const getParentAdressePayload = (form, parentId) => ({
  parent_id: Number(parentId),
  ...getAdressePayload(form),
})

export const getStudentAdressePayload = (form, studentId) => ({
  student_id: Number(studentId),
  ...getAdressePayload(form),
})

export const getOwnedAdressePayload = (form) => ({
  parent_id: form.parent_id ? Number(form.parent_id) : null,
  student_id: form.student_id ? Number(form.student_id) : null,
  ...getAdressePayload(form),
})

export const unwrapAdresse = (payload) => (
  payload?.adresse ?? payload?.data?.adresse ?? payload?.data ?? payload ?? null
)
