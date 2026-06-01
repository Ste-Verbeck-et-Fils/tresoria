import React from 'react'
import EntityListPage from '../components/EntityListPage'
import { getAdresses } from '../../../services/inscriptionService'
import { getParentName, getStudentName } from '../utils/data'

const getOwner = (adresse) => {
  if (adresse.parent) {
    return getParentName(adresse.parent)
  }

  if (adresse.student) {
    return getStudentName(adresse.student)
  }

  if (adresse.parent_id) {
    return `Parent #${adresse.parent_id}`
  }

  if (adresse.student_id) {
    return `Eleve #${adresse.student_id}`
  }

  return 'Non renseigne'
}

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Associee a', render: getOwner },
  { label: 'Commune', render: (item) => item.commune || 'Non renseigne' },
  { label: 'Quartier', render: (item) => item.quartier || 'Non renseigne' },
  { label: 'Avenue', render: (item) => item.avenue || 'Non renseigne' },
  { label: 'Numero', render: (item) => item.numero || 'Non renseigne' },
]

const AdressesPage = () => {
  return (
    <EntityListPage
      title='Adresses'
      description='Consultez les adresses rattachees aux parents et aux eleves.'
      loadItems={getAdresses}
      columns={columns}
      emptyMessage='Aucune adresse enregistree.'
      searchPlaceholder='Rechercher une adresse'
    />
  )
}

export default AdressesPage
