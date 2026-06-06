import React from 'react'
import { useLocation } from 'react-router-dom'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import { getClasses } from '../../../services/classeService'
import { formatNumber } from '../../inscriptions/utils/data'

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Designation', render: (item) => item.designation || '-' },
  { label: 'Capacite', render: (item) => formatNumber(item.capacite) },
  { label: 'Responsable', render: (item) => item.responsable || '-' },
  {
    label: 'Statut',
    render: (item) => (
      <span style={{ padding: '4px 8px', borderRadius: '12px', background: item.statut === 'ACTIF' ? '#e6f4ea' : '#f1f3f4', color: item.statut === 'ACTIF' ? '#1e8e3e' : '#5f6368', fontSize: '0.8rem', fontWeight: 600 }}>
        {item.statut || 'ACTIF'}
      </span>
    )
  },
]

const ClassesPage = () => {
  const location = useLocation()

  return (
    <EntityListPage
      title='Classes'
      description='Creez, consultez et administrez les classes disponibles pour les inscriptions.'
      loadItems={getClasses}
      columns={columns}
      emptyMessage='Aucune classe enregistree.'
      createPath='/classes/create'
      createLabel='Nouvelle classe'
      getRowPath={(item) => `/classes/${item.id}`}
      searchPlaceholder='Rechercher une classe'
      getSearchText={(item) => [
        item.id,
        item.designation,
        item.capacite,
        item.responsable,
      ].join(' ')}
      successMessage={location.state?.successMessage}
    />
  )
}

export default ClassesPage
