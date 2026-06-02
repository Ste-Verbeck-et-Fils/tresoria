export const normalizeAdresseForm = (adresse = {}) => ({
  commune: adresse.commune || '',
  quartier: adresse.quartier || '',
  avenue: adresse.avenue || '',
  numero: adresse.numero || '',
})

export const validateAdresseForm = (form) => {
  const errors = {}

  if (!form.quartier.trim()) {
    errors.quartier = 'Le quartier est obligatoire.'
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
