import React from 'react'
import EntityListPage from '../components/EntityListPage'
import StatusBadge from '../components/StatusBadge'
import { getAnneesScolaires } from '../../../services/inscriptionService'
import { formatNumber } from '../utils/data'

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Designation', render: (item) => item.designation || 'Non renseigne' },
  { label: 'Frais', render: (item) => formatNumber(item.frais) },
  { label: 'Budget', render: (item) => formatNumber(item.budget) },
  { label: 'Statut', render: (item) => <StatusBadge value={item.statut} /> },
]

const AnneesScolairesPage = () => {
  return (
    <EntityListPage
      title='Annees scolaires'
      description='Consultez les annees scolaires utilisees lors des inscriptions.'
      loadItems={getAnneesScolaires}
      columns={columns}
      emptyMessage='Aucune annee scolaire enregistree.'
      searchPlaceholder='Rechercher une annee scolaire'
    />
  )
}

export default AnneesScolairesPage
