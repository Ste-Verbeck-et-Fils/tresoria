import React from 'react'
import { useLocation } from 'react-router-dom'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import { getParents, searchParentsByPhone } from '../../../services/parentService'

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Nom complet', render: (item) => item.full_name || 'Non renseigne' },
  { label: 'Telephone', render: (item) => item.phone || 'Non renseigne' },
  { label: 'Genre', render: (item) => item.gender || 'Non renseigne' },
  { label: 'Profession', render: (item) => item.profession || 'Non renseigne' },
]

const ParentsPage = () => {
  const location = useLocation()

  return (
    <EntityListPage
      title='Parents'
      description='Recherchez un parent par telephone et gerez ses informations ainsi que ses adresses.'
      loadItems={getParents}
      columns={columns}
      emptyMessage='Aucun parent enregistre.'
      createPath='/parents/create'
      createLabel='Nouveau parent'
      getRowPath={(item) => `/parents/${item.id}`}
      searchPlaceholder='Rechercher un parent par telephone'
      getSearchText={(item) => item.phone || ''}
      searchItems={searchParentsByPhone}
      successMessage={location.state?.successMessage}
    />
  )
}

export default ParentsPage
