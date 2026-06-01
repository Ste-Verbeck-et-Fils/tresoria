import React from 'react'
import EntityListPage from '../components/EntityListPage'
import { getStudents } from '../../../services/inscriptionService'
import { formatDate, getStudentName } from '../utils/data'

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Nom complet', render: (item) => getStudentName(item) },
  { label: 'Sexe', render: (item) => item.sexe || 'Non renseigne' },
  { label: 'Date de naissance', render: (item) => formatDate(item.date_naissance) },
  { label: 'Contact', render: (item) => item.contact || 'Non renseigne' },
]

const StudentsPage = () => {
  return (
    <EntityListPage
      title='Eleves'
      description='Consultez les eleves disponibles pour une inscription.'
      loadItems={getStudents}
      columns={columns}
      emptyMessage='Aucun eleve enregistre.'
      searchPlaceholder='Rechercher un eleve'
    />
  )
}

export default StudentsPage
