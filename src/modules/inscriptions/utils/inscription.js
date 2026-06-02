import {
  getDesignation,
  getStudentName,
} from './data'

export const INSCRIPTION_STATUS_OPTIONS = [
  { value: 'ACTIF', label: 'Actif' },
  { value: 'INACTIF', label: 'Inactif' },
  { value: 'ABANDON', label: 'Abandon' },
  { value: 'RENVOI', label: 'Renvoi' },
]

export const INSCRIPTION_FILTER_OPTIONS = [
  { value: 'student', label: 'Eleve' },
  { value: 'classe', label: 'Classe' },
  { value: 'annee_scolaire', label: 'Annee scolaire' },
]

export const getInscriptionFilterLabel = (filterType) => {
  if (filterType === 'student') {
    return 'Eleve'
  }

  if (filterType === 'classe') {
    return 'Classe'
  }

  return filterType === 'annee_scolaire' ? 'Annee scolaire' : 'Filtre'
}

export const getInscriptionFilterOptions = (
  filterType,
  students = [],
  classes = [],
  anneesScolaires = []
) => {
  if (filterType === 'student') {
    return students.map((student) => ({
      value: student.id,
      label: getStudentName(student),
    }))
  }

  if (filterType === 'classe') {
    return classes.map((classe) => ({
      value: classe.id,
      label: getDesignation(classe, `Classe #${classe.id}`),
    }))
  }

  if (filterType === 'annee_scolaire') {
    return anneesScolaires.map((anneeScolaire) => ({
      value: anneeScolaire.id,
      label: getDesignation(anneeScolaire, `Annee #${anneeScolaire.id}`),
    }))
  }

  return []
}
