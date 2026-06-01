import React, { useEffect, useState } from 'react'
import { CalendarCheck2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import {
  getAnneeScolaireActive,
  getAnneesScolaires,
} from '../../../services/anneeScolaireService'
import { formatNumber } from '../../inscriptions/utils/data'
import { unwrapAnneeScolaire } from '../utils/anneeScolaire'

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Designation', render: (item) => item.designation || 'Non renseigne' },
  { label: 'Frais', render: (item) => formatNumber(item.frais) },
  { label: 'Budget', render: (item) => formatNumber(item.budget) },
  { label: 'Statut', render: (item) => <StatusBadge value={item.statut} /> },
]

const AnneesScolairesPage = () => {
  const location = useLocation()
  const [activeAnnee, setActiveAnnee] = useState(null)
  const [isLoadingActive, setIsLoadingActive] = useState(true)
  const [activeError, setActiveError] = useState('')

  useEffect(() => {
    let isCancelled = false

    getAnneeScolaireActive()
      .then((payload) => {
        if (!isCancelled) {
          setActiveAnnee(unwrapAnneeScolaire(payload))
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setActiveError(error.message || 'Impossible de charger l annee scolaire active.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingActive(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const activeContent = (
    <article className='active-annee-card'>
      <div className='active-annee-card__icon'>
        <CalendarCheck2 size={26} aria-hidden='true' />
      </div>
      <div className='active-annee-card__content'>
        <p className='active-annee-card__label'>Annee scolaire active</p>
        {isLoadingActive && <p className='active-annee-card__state'>Chargement...</p>}
        {!isLoadingActive && activeError && <p className='active-annee-card__error'>{activeError}</p>}
        {!isLoadingActive && !activeError && activeAnnee?.id && (
          <div className='active-annee-card__details'>
            <h2>{activeAnnee.designation}</h2>
            <StatusBadge value={activeAnnee.statut} />
            <span>Frais : {formatNumber(activeAnnee.frais)}</span>
            <span>Budget : {formatNumber(activeAnnee.budget)}</span>
          </div>
        )}
        {!isLoadingActive && !activeError && !activeAnnee?.id && (
          <p className='active-annee-card__state'>Aucune annee scolaire active.</p>
        )}
      </div>
    </article>
  )

  return (
    <EntityListPage
      title='Annees scolaires'
      description='Creez, consultez et administrez les annees scolaires.'
      loadItems={getAnneesScolaires}
      columns={columns}
      emptyMessage='Aucune annee scolaire enregistree.'
      createPath='/annees-scolaires/create'
      createLabel='Nouvelle annee scolaire'
      getRowPath={(item) => `/annees-scolaires/${item.id}`}
      searchPlaceholder='Rechercher une annee scolaire'
      getSearchText={(item) => [
        item.id,
        item.designation,
        item.frais,
        item.budget,
        item.statut,
      ].join(' ')}
      successMessage={location.state?.successMessage}
      beforePanel={activeContent}
    />
  )
}

export default AnneesScolairesPage
