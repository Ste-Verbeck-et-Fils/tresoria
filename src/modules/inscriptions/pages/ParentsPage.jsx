import React from 'react'
import EntityListPage from '../components/EntityListPage'
import { getParents } from '../../../services/inscriptionService'

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Nom complet', render: (item) => item.full_name || 'Non renseigne' },
  { label: 'Telephone', render: (item) => item.phone || 'Non renseigne' },
  { label: 'Genre', render: (item) => item.gender || 'Non renseigne' },
  { label: 'Profession', render: (item) => item.profession || 'Non renseigne' },
]

const ParentsPage = () => {
  return (
    <EntityListPage
      title='Parents'
      description='Consultez les responsables associes aux eleves.'
      loadItems={getParents}
      columns={columns}
      emptyMessage='Aucun parent enregistre.'
      searchPlaceholder='Rechercher un parent'
    />
  )
}

export default ParentsPage
