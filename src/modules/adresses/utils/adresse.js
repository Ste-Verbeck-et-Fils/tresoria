import { getParentName, getStudentName } from '../../inscriptions/utils/data'

export const OWNER_TYPE_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'student', label: 'Eleve' },
]

export const getAdresseOwnerType = (adresse = {}) => {
  if (adresse.parent_id || adresse.parent) {
    return 'parent'
  }

  if (adresse.student_id || adresse.student) {
    return 'student'
  }

  return ''
}

export const getAdresseOwnerName = (adresse = {}, parents = [], students = []) => {
  if (adresse.parent) {
    return getParentName(adresse.parent)
  }

  if (adresse.student) {
    return getStudentName(adresse.student)
  }

  if (adresse.parent_id) {
    const parent = parents.find((item) => Number(item.id) === Number(adresse.parent_id))
    return parent ? getParentName(parent) : `Parent #${adresse.parent_id}`
  }

  if (adresse.student_id) {
    const student = students.find((item) => Number(item.id) === Number(adresse.student_id))
    return student ? getStudentName(student) : `Eleve #${adresse.student_id}`
  }

  return 'Non renseigne'
}

export const getAdresseOwnerLabel = (adresse = {}) => (
  getAdresseOwnerType(adresse) === 'parent' ? 'Parent' : getAdresseOwnerType(adresse) === 'student' ? 'Eleve' : 'Non renseigne'
)

export const getAdresseText = (adresse = {}) => (
  [adresse.numero, adresse.avenue, adresse.quartier, adresse.commune]
    .filter(Boolean)
    .join(', ') || 'Adresse non renseignee'
)

export const getOwnerOptions = (ownerType, parents = [], students = []) => {
  if (ownerType === 'parent') {
    return parents.map((parent) => ({
      value: parent.id,
      label: `${getParentName(parent)}${parent.phone ? ` - ${parent.phone}` : ''}`,
    }))
  }

  if (ownerType === 'student') {
    return students.map((student) => ({
      value: student.id,
      label: `${getStudentName(student)}${student.contact ? ` - ${student.contact}` : ''}`,
    }))
  }

  return []
}
