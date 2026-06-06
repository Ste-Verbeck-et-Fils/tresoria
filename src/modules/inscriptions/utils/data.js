const COLLECTION_KEYS = [
  'items',
  'results',
  'data',
  'inscriptions',
  'paiements',
  'payments',
  'depenses',
  'expenses',
  'classes',
  'annees',
  'annees_scolaires',
  'parents',
  'students',
  'adresses',
]

export const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload
  }

  for (const key of COLLECTION_KEYS) {
    if (Array.isArray(payload?.[key])) {
      return payload[key]
    }
  }

  if (payload?.data && payload.data !== payload) {
    return normalizeCollection(payload.data)
  }

  return []
}

export const unwrapEntity = (payload, key) => payload?.[key] || payload?.data?.[key] || payload?.data || payload || {}

export const formatDate = (value) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('fr-FR').format(date)
}

export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const number = Number(value)

  if (Number.isNaN(number)) {
    return String(value)
  }

  return new Intl.NumberFormat('fr-FR').format(number)
}

export const getStudentName = (student) => {
  if (!student) {
    return '-'
  }

  if (typeof student === 'string') {
    return student
  }

  return [student.nom, student.postnom, student.prenom].filter(Boolean).join(' ') ||
    student.full_name ||
    '-'
}

export const getParentName = (parent) => {
  if (!parent) {
    return '-'
  }

  if (typeof parent === 'string') {
    return parent
  }

  return parent.full_name || parent.nom || '-'
}

export const getDesignation = (entity, fallback = '-') => {
  if (!entity) {
    return fallback
  }

  if (typeof entity === 'string') {
    return entity
  }

  return entity.designation || entity.nom || fallback
}

export const getInscriptionStudent = (inscription) => (
  inscription.student || inscription.eleve || (inscription.student_id ? `Eleve #${inscription.student_id}` : null)
)

export const getInscriptionClasse = (inscription) => inscription.classe || inscription.class

export const getInscriptionParent = (inscription) => (
  inscription.parent || (inscription.parent_id ? `Parent #${inscription.parent_id}` : null)
)

export const getInscriptionAnnee = (inscription) => inscription.annee_scolaire || inscription.anneeScolaire
