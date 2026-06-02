export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN']

const COLLECTION_KEYS = [
  'items',
  'results',
  'data',
  'inscriptions',
  'classes',
  'annees_scolaires',
  'parents',
  'students',
  'adresses',
]

export const normalizeRole = (role = '') => role.trim().toUpperCase()

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

export const unwrapEntity = (payload, key) => payload?.[key] || payload?.data || payload || {}

export const formatDate = (value) => {
  if (!value) {
    return 'Non renseigne'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('fr-FR').format(date)
}

export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Non renseigne'
  }

  const number = Number(value)

  if (Number.isNaN(number)) {
    return String(value)
  }

  return new Intl.NumberFormat('fr-FR').format(number)
}

export const getStudentName = (student) => {
  if (!student) {
    return 'Eleve non renseigne'
  }

  if (typeof student === 'string') {
    return student
  }

  return [student.nom, student.postnom, student.prenom].filter(Boolean).join(' ') ||
    student.full_name ||
    `Eleve #${student.id || '-'}`
}

export const getParentName = (parent) => {
  if (!parent) {
    return 'Non renseigne'
  }

  if (typeof parent === 'string') {
    return parent
  }

  return parent.full_name || parent.nom || `Parent #${parent.id || '-'}`
}

export const getDesignation = (entity, fallback = 'Non renseigne') => {
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
