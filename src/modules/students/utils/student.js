export const SEXE_OPTIONS = [
  { value: 'MASCULIN', label: 'Masculin' },
  { value: 'FEMININ', label: 'Feminin' },
]

const toDateInputValue = (value) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10)
  }

  return date.toISOString().slice(0, 10)
}

export const normalizeStudentForm = (student = {}) => ({
  pere_id: student.pere_id ?? '',
  mere_id: student.mere_id ?? '',
  nom: student.nom || '',
  postnom: student.postnom || '',
  prenom: student.prenom || '',
  sexe: student.sexe || '',
  lieu_naissance: student.lieu_naissance || '',
  date_naissance: toDateInputValue(student.date_naissance),
  province_origine: student.province_origine || '',
  territoire_origine: student.territoire_origine || '',
  collectivite_origine: student.collectivite_origine || '',
  groupement_origine: student.groupement_origine || '',
  localite_origine: student.localite_origine || '',
  contact: student.contact || '',
})

export const unwrapStudent = (payload) => (
  payload?.student ?? payload?.eleve ?? payload?.data?.student ?? payload?.data ?? payload ?? null
)

export const validateStudentForm = (form) => {
  const errors = {}
  const requiredFields = [
    ['nom', 'Le nom est obligatoire.'],
    ['postnom', 'Le postnom est obligatoire.'],
    ['prenom', 'Le prenom est obligatoire.'],
    ['sexe', 'Le sexe est obligatoire.'],
    ['lieu_naissance', 'Le lieu de naissance est obligatoire.'],
    ['date_naissance', 'La date de naissance est obligatoire.'],
    ['province_origine', 'La province d origine est obligatoire.'],
    ['territoire_origine', 'Le territoire d origine est obligatoire.'],
    ['collectivite_origine', 'La collectivite d origine est obligatoire.'],
    ['groupement_origine', 'Le groupement d origine est obligatoire.'],
    ['localite_origine', 'La localite d origine est obligatoire.'],
  ]

  requiredFields.forEach(([field, message]) => {
    if (!String(form[field]).trim()) {
      errors[field] = message
    }
  })

  if (form.date_naissance) {
    const date = new Date(`${form.date_naissance}T00:00:00.000Z`)
    const isValidDate = !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === form.date_naissance

    if (!isValidDate) {
      errors.date_naissance = 'La date de naissance est invalide.'
    } else {
      const diffMs = Date.now() - date.getTime()
      const ageDate = new Date(diffMs)
      const age = Math.abs(ageDate.getUTCFullYear() - 1970)
      if (age < 2) {
        errors.date_naissance = 'L\'enfant doit avoir au moins 2 ans pour être enregistré.'
      }
    }
  }

  if (form.pere_id && form.mere_id && Number(form.pere_id) === Number(form.mere_id)) {
    errors.mere_id = 'Le pere et la mere doivent etre differents.'
  }

  return errors
}

export const getStudentPayload = (form) => ({
  pere_id: form.pere_id ? Number(form.pere_id) : null,
  mere_id: form.mere_id ? Number(form.mere_id) : null,
  nom: form.nom.trim(),
  postnom: form.postnom.trim(),
  prenom: form.prenom.trim(),
  sexe: form.sexe,
  lieu_naissance: form.lieu_naissance.trim(),
  date_naissance: new Date(`${form.date_naissance}T00:00:00.000Z`).toISOString(),
  province_origine: form.province_origine.trim(),
  territoire_origine: form.territoire_origine.trim(),
  collectivite_origine: form.collectivite_origine.trim(),
  groupement_origine: form.groupement_origine.trim(),
  localite_origine: form.localite_origine.trim(),
  contact: form.contact.trim() || null,
})

export const getStudentParent = (student, parentType, parents = []) => {
  const relation = student?.[parentType]
  const relationId = student?.[`${parentType}_id`]

  return relation ||
    parents.find((parent) => Number(parent.id) === Number(relationId)) ||
    (relationId ? `Parent #${relationId}` : null)
}
