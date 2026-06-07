import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import {
  getTresorerie,
  getTresorerieAnneeScolaire,
  getTresoreriePeriode,
  getTresorerieResume,
} from '../../../services/tresorerieService'
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
  getTresorerieFilterMode,
  getTresorerieScopeLabel,
  getTresorerieSummary,
  validateTresorerieFilters,
} from '../utils/tresorerie'

const TresoreriePage = () => {
  const navigate = useNavigate()
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [draftFilters, setDraftFilters] = useState(DEFAULT_TRESORERIE_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_TRESORERIE_FILTERS)
  const [tresorerie, setTresorerie] = useState(null)
  const [resume, setResume] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [resumeError, setResumeError] = useState('')
  const [optionsError, setOptionsError] = useState('')
  const [filterError, setFilterError] = useState('')
  const [isForbidden, setIsForbidden] = useState(false)
  const [forbiddenMessage, setForbiddenMessage] = useState('')

  const loadCurrentTresorerie = useCallback(() => {
    const mode = getTresorerieFilterMode(appliedFilters)

    if (mode === 'periode') {
      return getTresoreriePeriode({
        start_date: formatDateForApi(appliedFilters.start_date),
        end_date: formatDateForApi(appliedFilters.end_date),
      })
    }

    if (mode === 'annee') {
      return getTresorerieAnneeScolaire(appliedFilters.annee_scolaire_id)
    }

    return getTresorerie()
  }, [appliedFilters])

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    setResumeError('')
    setIsForbidden(false)
    setForbiddenMessage('')

    const [tresorerieResult, resumeResult] = await Promise.allSettled([
      loadCurrentTresorerie(),
      getTresorerieResume(),
    ])

    let hasForbidden = false

    if (tresorerieResult.status === 'rejected' && tresorerieResult.reason?.status === 403) {
      hasForbidden = true
      setForbiddenMessage(tresorerieResult.reason.message || 'Accès refusé.')
    } else if (resumeResult.status === 'rejected' && resumeResult.reason?.status === 403) {
      hasForbidden = true
      setForbiddenMessage(resumeResult.reason.message || 'Accès refusé.')
    }

    if (hasForbidden) {
      setIsForbidden(true)
      setIsLoading(false)
      return
    }

    if (tresorerieResult.status === 'fulfilled') {
      setTresorerie(tresorerieResult.value)
    } else {
      setLoadError(tresorerieResult.reason?.message || 'Impossible de charger la tresorerie.')
    }

    if (resumeResult.status === 'fulfilled') {
      setResume(resumeResult.value)
    } else {
      setResumeError(resumeResult.reason?.message || 'Impossible de charger le resume global.')
    }

    setIsLoading(false)
  }, [loadCurrentTresorerie])

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
    let isCancelled = false

    setIsLoading(true)
    setIsForbidden(false)
    setLoadError('')
    setResumeError('')

    Promise.allSettled([
      loadCurrentTresorerie(),
      getTresorerieResume(),
    ]).then(([tresorerieResult, resumeResult]) => {
      if (isCancelled) {
        return
      }

      let hasForbidden = false

      if (tresorerieResult.status === 'rejected' && tresorerieResult.reason?.status === 403) {
        hasForbidden = true
        setForbiddenMessage(tresorerieResult.reason.message || 'Accès refusé.')
      } else if (resumeResult.status === 'rejected' && resumeResult.reason?.status === 403) {
        hasForbidden = true
        setForbiddenMessage(resumeResult.reason.message || 'Accès refusé.')
      }

      if (hasForbidden) {
        setIsForbidden(true)
        setIsLoading(false)
        return
      }

      if (tresorerieResult.status === 'fulfilled') {
        setTresorerie(tresorerieResult.value)
      } else {
        setLoadError(tresorerieResult.reason?.message || 'Impossible de charger la tresorerie.')
      }

      if (resumeResult.status === 'fulfilled') {
        setResume(resumeResult.value)
      } else {
        setResumeError(resumeResult.reason?.message || 'Impossible de charger le resume global.')
      }

      setIsLoading(false)
    })

    return () => {
      isCancelled = true
    }
  }, [loadCurrentTresorerie])

  useEffect(() => {
    let isCancelled = false

    getAnneesScolaires()
      .then((payload) => {
        if (!isCancelled) {
          setAnneesScolaires(normalizeCollection(payload))
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setOptionsError(error.message || 'Impossible de charger les annees scolaires.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingOptions(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const anneeOptions = useMemo(
    () => anneesScolaires.map((annee) => ({
      value: annee.id,
      label: getDesignation(annee, `Annee #${annee.id}`),
      searchText: annee.statut || annee.status || '',
    })),
    [anneesScolaires]
  )
  const currentSummary = useMemo(() => getTresorerieSummary(tresorerie), [tresorerie])
  const globalSummary = useMemo(() => getTresorerieSummary(resume), [resume])
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
    setResumeError('')
    setIsForbidden(false)
    setTresorerie(null) // Clear data on new search
    setResume(null)
    setIsLoading(true)
    setAppliedFilters({ ...draftFilters })
  }

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_TRESORERIE_FILTERS)
    setAppliedFilters(DEFAULT_TRESORERIE_FILTERS)
    setFilterError('')
    setLoadError('')
    setResumeError('')
    setIsForbidden(false)
    setTresorerie(null)
    setResume(null)
    setIsLoading(true)
  }

  const renderSummaryCards = (summary) => (
    <div className='inscription-amount-grid tresorerie-amount-grid'>
      <article className='inscription-amount-card'>
        <span>Entrees comptabilisables</span>
        <strong>{formatAmount(summary.entreesComptabilisables)}</strong>
      </article>
      <article className='inscription-amount-card'>
        <span>Sorties confirmees</span>
        <strong>{formatAmount(summary.sortiesConfirmees)}</strong>
      </article>
      <article className='inscription-amount-card inscription-amount-card--total'>
        <span>Solde de tresorerie</span>
        <strong>{formatAmount(summary.soldeTresorerie)}</strong>
      </article>
    </div>
  )

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
            Filtrez la vue courante par annee scolaire ou par periode. Le resume global reste affiche
            separement.
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
          message={forbiddenMessage || 'Vous n avez pas les permissions nécessaires pour accéder à cette ressource.'}
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

      {!isLoading && !isForbidden && !loadError && (
        <div className='detail-page-stack'>
          <section className='inscription-amount-panel'>
            <div>
              <h2>Vue courante</h2>
              <p>{scopeLabel}</p>
            </div>

            {renderSummaryCards(currentSummary)}
          </section>

          <DetailSection title='Resume global'>
            {resumeError && !isForbidden && (
              <div className='inscription-detail-field inscription-detail-field--wide inscription-solde-error'>
                <dt>Erreur resume</dt>
                <dd>{resumeError}</dd>
              </div>
            )}
            <DetailField
              label='Entrees comptabilisables'
              value={formatAmount(globalSummary.entreesComptabilisables)}
            />
            <DetailField
              label='Sorties confirmees'
              value={formatAmount(globalSummary.sortiesConfirmees)}
            />
            <DetailField
              label='Solde de tresorerie'
              value={formatAmount(globalSummary.soldeTresorerie)}
            />
          </DetailSection>
        </div>
      )}
    </section>
  )
}

export default TresoreriePage
