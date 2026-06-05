import React from 'react'
import { useLocation } from 'react-router-dom'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import { getStudents } from '../../../services/studentService'
import { formatDate, getStudentName } from '../../inscriptions/utils/data'

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Nom complet', render: (item) => getStudentName(item) },
  { label: 'Sexe', render: (item) => item.sexe || 'Non renseigne' },
  { label: 'Date de naissance', render: (item) => formatDate(item.date_naissance) },
  { label: 'Contact', render: (item) => item.contact || 'Non renseigne' },
]

const StudentsPage = () => {
  const location = useLocation()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : {}
  const isParent = user?.role === 'PARENT'

  return (
    <EntityListPage
      title='Eleves'
      loadItems={getStudents}
      columns={columns}
      emptyMessage='Aucun eleve enregistre.'
      createPath={isParent ? null : '/students/create'}
      createLabel={isParent ? null : 'Nouvel eleve'}
      getRowPath={(item) => `/students/${item.id}`}
      searchPlaceholder='Rechercher un eleve'
      getSearchText={(item) => [
        item.id,
        item.nom,
        item.postnom,
        item.prenom,
        item.sexe,
        item.contact,
      ].join(' ')}
      successMessage={location.state?.successMessage}
    />
  )
}

export default StudentsPage
