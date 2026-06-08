import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { getTresorerieDashboard } from '../../../services/tresorerieService'
import DetailField from '../../inscriptions/components/DetailField'
import DetailSection from '../../inscriptions/components/DetailSection'
import ModuleState from '../../inscriptions/components/ModuleState'
import SearchableSelectField from '../../inscriptions/components/SearchableSelectField'
import { formatAmount } from '../../inscriptions/utils/amounts'
import {
  getDesignation,
  normalizeCollection,
  formatDateForApi,
} from '../../inscriptions/utils/data'
import {
  DEFAULT_TRESORERIE_FILTERS,
  getTresorerieScopeLabel,
  validateTresorerieFilters,
} from '../utils/tresorerie'

const TresoreriePage = () => {
  const navigate = useNavigate()
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [draftFilters, setDraftFilters] = useState(DEFAULT_TRESORERIE_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_TRESORERIE_FILTERS)
  
  const [dashboardData, setDashboardData] = useState(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [optionsError, setOptionsError] = useState('')
  const [filterError, setFilterError] = useState('')
  const [isForbidden, setIsForbidden] = useState(false)
  const [forbiddenMessage, setForbiddenMessage] = useState('')

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    setIsForbidden(false)
    setForbiddenMessage('')

    try {
      const params = {}
      if (appliedFilters.annee_scolaire_id) params.anneeScolaireId = appliedFilters.annee_scolaire_id
      if (appliedFilters.start_date) params.dateDebut = formatDateForApi(appliedFilters.start_date)
      if (appliedFilters.end_date) params.dateFin = formatDateForApi(appliedFilters.end_date)

      const payload = await getTresorerieDashboard(params)
      setDashboardData(payload.data)
    } catch (error) {
      if (error.status === 403) {
        setIsForbidden(true)
        setForbiddenMessage(error.message || 'Accès refusé.')
      } else {
        setLoadError(error.message || 'Impossible de charger la tresorerie.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [appliedFilters])

  const loadAnnees = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError('')

    try {
      const payload = await getAnneesScolaires()
      setAnneesScolaires(normalizeCollection(payload))
    } catch (error) {
      setOptionsError(error.message || 'Impossible de charger les annees scolaires.')
    } finally {
      setIsLoadingOptions(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    loadAnnees()
  }, [loadAnnees])

  const anneeOptions = useMemo(
    () => anneesScolaires.map((annee) => ({
      value: annee.id,
      label: getDesignation(annee, `Annee #${annee.id}`),
      searchText: annee.statut || annee.status || '',
    })),
    [anneesScolaires]
  )

  const scopeLabel = useMemo(
    () => getTresorerieScopeLabel(appliedFilters, anneesScolaires),
    [anneesScolaires, appliedFilters]
  )

  const hasActiveFilters = Boolean(
    appliedFilters.annee_scolaire_id ||
    appliedFilters.start_date ||
    appliedFilters.end_date
  )
  const hasDraftFilters = Boolean(
    draftFilters.annee_scolaire_id ||
    draftFilters.start_date ||
    draftFilters.end_date
  )

  const handleFilterChange = (event) => {
    const { id, value } = event.target

    setDraftFilters((currentFilters) => {
      const nextFilters = { ...currentFilters, [id]: value }

      if (id === 'annee_scolaire_id' && value) {
        nextFilters.start_date = ''
        nextFilters.end_date = ''
      }

      if ((id === 'start_date' || id === 'end_date') && value) {
        nextFilters.annee_scolaire_id = ''
      }

      return nextFilters
    })

    if (filterError) {
      setFilterError('')
    }
  }

  const handleApplyFilters = () => {
    const nextError = validateTresorerieFilters(draftFilters)

    if (nextError) {
      setFilterError(nextError)
      return
    }

    setFilterError('')
    setLoadError('')
    setIsForbidden(false)
    setDashboardData(null)
    setIsLoading(true)
    setAppliedFilters({ ...draftFilters })
  }

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_TRESORERIE_FILTERS)
    setAppliedFilters(DEFAULT_TRESORERIE_FILTERS)
    setFilterError('')
    setLoadError('')
    setIsForbidden(false)
    setDashboardData(null)
    setIsLoading(true)
  }

  const renderSummaryCards = (summary, title, subtitle) => {
    if (!summary) return null
    return (
      <section className='inscription-amount-panel' style={{ marginBottom: '24px' }}>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className='inscription-amount-grid tresorerie-amount-grid'>
          <article className='inscription-amount-card'>
            <span>Entrées comptabilisables</span>
            <strong>{formatAmount(summary.entreesComptabilisables)}</strong>
          </article>
          <article className='inscription-amount-card'>
            <span>Sorties confirmées</span>
            <strong>{formatAmount(summary.sortiesConfirmees)}</strong>
          </article>
          <article className='inscription-amount-card inscription-amount-card--total'>
            <span>Solde de trésorerie</span>
            <strong>{formatAmount(summary.soldeTresorerie)}</strong>
          </article>
        </div>
      </section>
    )
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <h1>Tableau de bord tresorerie</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type='button'
            variant='super'
            label='Nouvelle entrée'
            onClick={() => navigate('/paiements/create')}
            className='inscription-action inscription-action--primary'
          />
          <Button
            type='button'
            variant='ghost'
            label='Nouvelle sortie'
            onClick={() => navigate('/depenses/create')}
            className='inscription-action inscription-action--secondary'
          />
        </div>
      </header>

      <section className='module-filter-panel tresorerie-filter-panel'>
        <div>
          <h2>Filtrer la tresorerie</h2>
          <p>
            Filtrez la vue courante par annee scolaire ou par periode. Le resume global reste affiche separement.
          </p>
        </div>

        <div className='module-filter-panel__fields tresorerie-filter-panel__fields'>
          <SearchableSelectField
            id='annee_scolaire_id'
            label='Annee scolaire'
            value={draftFilters.annee_scolaire_id}
            options={anneeOptions}
            placeholder='Rechercher une annee scolaire'
            emptyMessage='Aucune annee scolaire ne correspond a votre recherche.'
            disabled={isLoadingOptions}
            onChange={handleFilterChange}
          />
          <Input
            id='start_date'
            type='date'
            label='Date debut'
            placeholder='Date debut'
            value={draftFilters.start_date}
            disabled={isLoadingOptions}
            onChange={handleFilterChange}
          />
          <Input
            id='end_date'
            type='date'
            label='Date fin'
            placeholder='Date fin'
            value={draftFilters.end_date}
            disabled={isLoadingOptions}
            onChange={handleFilterChange}
          />
          <div className='tresorerie-filter-panel__actions'>
            {(hasActiveFilters || hasDraftFilters) && (
              <Button
                type='button'
                variant='ghost'
                label='Reinitialiser'
                disabled={isLoading || isLoadingOptions}
                onClick={handleResetFilters}
                className='inscription-action inscription-action--secondary'
              />
            )}
            <Button
              type='button'
              variant='super'
              label='Appliquer'
              disabled={isLoading || isLoadingOptions}
              onClick={handleApplyFilters}
              className='inscription-action inscription-action--primary'
            />
          </div>
        </div>

        {filterError && <Feedback type='error' message={filterError} />}
        {optionsError && (
          <div className='module-filter-panel__warning'>
            <Feedback type='warning' message={optionsError} />
            <Button
              type='button'
              variant='ghost'
              label='Reessayer'
              onClick={loadAnnees}
              className='inscription-action inscription-action--secondary'
            />
          </div>
        )}
      </section>

      {isLoading && <Loader message='Chargement de la tresorerie...' />}

      {!isLoading && isForbidden && (
        <ModuleState
          type='error'
          title='Accès réservé'
          message={forbiddenMessage}
        />
      )}

      {!isLoading && !isForbidden && loadError && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={loadError}
          actionLabel='Reessayer'
          onAction={loadDashboard}
        />
      )}

      {!isLoading && !isForbidden && !loadError && dashboardData && (
        <div className='detail-page-stack'>
          {/* Vue Courante */}
          {renderSummaryCards(dashboardData.vueCourante, 'Vue courante', scopeLabel)}

          {/* Résumé Global */}
          {renderSummaryCards(dashboardData.resumeGlobal, 'Résumé global', 'Toutes les années et périodes confondues')}

          {/* Soldes réels disponibles */}
          <DetailSection title='Soldes réels disponibles' description='Montants réellement disponibles en possession de l école.'>
            <DetailField label='Caisse' value={formatAmount(dashboardData.soldesReels.caisse)} />
            <DetailField label='Mobile Money' value={formatAmount(dashboardData.soldesReels.mobileMoney)} />
            <DetailField label='Banque' value={formatAmount(dashboardData.soldesReels.banque)} />
            <DetailField label='Solde disponible' value={formatAmount(dashboardData.soldesReels.soldeDisponible)} className='inscription-detail-field--highlight' />
            <DetailField label='Chèques en attente' value={formatAmount(dashboardData.soldesReels.chequesEnAttente)} />
          </DetailSection>

          {/* Chèques */}
          <DetailSection title='État des chèques'>
            <DetailField label='Entrées (Chèques reçus en attente)' value={formatAmount(dashboardData.cheques.entreesChequesEnAttente)} />
            <DetailField label='Sorties (Chèques émis en attente)' value={formatAmount(dashboardData.cheques.sortiesChequesEnAttente)} />
            <DetailField label='Total chèques en attente' value={formatAmount(dashboardData.cheques.totalChequesEnAttente)} />
            <DetailField label='Chèques encaissés' value={formatAmount(dashboardData.cheques.chequesEncaisses)} />
            <DetailField label='Chèques rejetés' value={formatAmount(dashboardData.cheques.chequesRejetes)} />
            <DetailField label='Chèques annulés' value={formatAmount(dashboardData.cheques.chequesAnnules)} />
          </DetailSection>

          {/* Transport */}
          <DetailSection title='Résumé Transport'>
            <DetailField label='Entrées transport' value={formatAmount(dashboardData.transport.entreesTransport)} />
            <DetailField label='Sorties transport' value={formatAmount(dashboardData.transport.sortiesTransport)} />
            <DetailField label='Solde transport' value={formatAmount(dashboardData.transport.soldeTransport)} className='inscription-detail-field--highlight' />
            
            <div className='inscription-detail-field inscription-detail-field--wide' style={{ marginTop: '16px' }}>
              <dt>Détail des sorties transport</dt>
              <dd>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Chauffeur:</span> <strong>{formatAmount(dashboardData.transport.detailsSorties.chauffeur)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Carburant:</span> <strong>{formatAmount(dashboardData.transport.detailsSorties.carburant)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Entretien:</span> <strong>{formatAmount(dashboardData.transport.detailsSorties.entretienBusScolaire)}</strong>
                  </div>
                </div>
              </dd>
            </div>
          </DetailSection>

          {/* Entrées par catégorie */}
          {dashboardData.entreesParCategorie && dashboardData.entreesParCategorie.length > 0 && (
            <DetailSection title='Entrées par catégorie'>
              {dashboardData.entreesParCategorie.map((item, index) => (
                <DetailField key={index} label={item.categorie} value={formatAmount(item.montant)} />
              ))}
            </DetailSection>
          )}

          {/* Sorties par catégorie */}
          {dashboardData.sortiesParCategorie && dashboardData.sortiesParCategorie.length > 0 && (
            <DetailSection title='Sorties par catégorie'>
              {dashboardData.sortiesParCategorie.map((item, index) => (
                <DetailField key={index} label={item.categorie} value={formatAmount(item.montant)} />
              ))}
            </DetailSection>
          )}

        </div>
      )}
    </section>
  )
}

export default TresoreriePage
