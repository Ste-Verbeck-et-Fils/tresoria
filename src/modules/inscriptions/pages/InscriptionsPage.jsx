import React from 'react'
import EntityListPage from '../components/EntityListPage'
import StatusBadge from '../components/StatusBadge'
import { getInscriptions } from '../../../services/inscriptionService'
import {
  getDesignation,
  getInscriptionAnnee,
  getInscriptionClasse,
  getInscriptionParent,
  getInscriptionStudent,
  getParentName,
  getStudentName,
} from '../utils/data'

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Eleve', render: (item) => getStudentName(getInscriptionStudent(item)) },
  { label: 'Parent', render: (item) => getParentName(getInscriptionParent(item)) },
  { label: 'Classe', render: (item) => getDesignation(getInscriptionClasse(item), `Classe #${item.class_id || '-'}`) },
  { label: 'Annee scolaire', render: (item) => getDesignation(getInscriptionAnnee(item), `Annee #${item.annee_scolaire_id || '-'}`) },
  { label: 'Statut', render: (item) => <StatusBadge value={item.statut} /> },
]

const InscriptionsPage = () => {
  return (
    <EntityListPage
      title='Inscriptions'
      description='Consultez les inscriptions enregistrees et ouvrez leur detail.'
      loadItems={getInscriptions}
      columns={columns}
      emptyMessage='Aucune inscription enregistree.'
      createPath='/inscriptions/create'
      createLabel='Nouvelle inscription'
      getRowPath={(item) => `/inscriptions/${item.id}`}
      searchPlaceholder='Rechercher une inscription'
      getSearchText={(item) => [
        item.id,
        getStudentName(getInscriptionStudent(item)),
        getParentName(getInscriptionParent(item)),
        getDesignation(getInscriptionClasse(item)),
        getDesignation(getInscriptionAnnee(item)),
        item.statut,
      ].join(' ')}
    />
  )
}

export default InscriptionsPage
