import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { getDepenses } from '../../../services/depenseService'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import SearchableSelectField from '../../inscriptions/components/SearchableSelectField'
import SelectField from '../../inscriptions/components/SelectField'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import {
  formatDate,
  getDesignation,
  normalizeCollection,
} from '../../inscriptions/utils/data'
import { formatAmount } from '../../inscriptions/utils/amounts'
import {

  DEFAULT_DEPENSE_FILTERS,
  getAnneeScolaireOptionLabel,
  getDepenseAnneeScolaire,
  getDepenseBeneficiaire,
  getDepenseCategorie,
  getDepenseDate,
  getDepenseFilterParams,
  getDepenseModePaiement,
  getDepenseMontant,
  getDepenseSearchText,
  getDepenseStatus,
  hasActiveDepenseFilters,
  CATEGORIE_DEPENSE_OPTIONS,
  MODE_DEPENSE_OPTIONS,
  STATUT_DEPENSE_OPTIONS,
} from '../utils/depense'

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  {
    label: 'Annee scolaire',
    render: (item) => getDesignation(getDepenseAnneeScolaire(item), `Annee #${item.annee_scolaire_id || '-'}`),
  },
  { label: 'Categorie', render: (item) => getDepenseCategorie(item) || '-' },
  { label: 'Beneficiaire', render: (item) => getDepenseBeneficiaire(item) || '-' },
  { label: 'Mode', render: (item) => getDepenseModePaiement(item) || '-' },
  { label: 'Montant', render: (item) => formatAmount(getDepenseMontant(item)) },
  { label: 'Statut', render: (item) => <StatusBadge value={getDepenseStatus(item)} /> },
  { label: 'Date', render: (item) => formatDate(getDepenseDate(item)) },
]

const DepensesPage = () => {
  const location = useLocation()
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [draftFilters, setDraftFilters] = useState(DEFAULT_DEPENSE_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_DEPENSE_FILTERS)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [filterError, setFilterError] = useState('')

  const applyAnneesPayload = useCallback((payload) => {
    setAnneesScolaires(normalizeCollection(payload))
  }, [])

  const loadOptions = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError('')

    try {
      const payload = await getAnneesScolaires()
      applyAnneesPayload(payload)
    } catch (error) {
      setOptionsError(error.message || 'Impossible de charger les annees scolaires pour le filtre.')
    } finally {
      setIsLoadingOptions(false)
    }
  }, [applyAnneesPayload])

  useEffect(() => {
    let isCancelled = false

    getAnneesScolaires()
      .then((payload) => {
        if (!isCancelled) {
          applyAnneesPayload(payload)
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setOptionsError(error.message || 'Impossible de charger les annees scolaires pour le filtre.')
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
  }, [applyAnneesPayload])

  const loadDepenses = useCallback(() => {
    return getDepenses(getDepenseFilterParams(appliedFilters))
  }, [appliedFilters])

  const anneeOptions = useMemo(
    () => anneesScolaires.map((annee) => ({
      value: annee.id,
      label: getAnneeScolaireOptionLabel(annee),
      searchText: annee.statut || annee.status || '',
    })),
    [anneesScolaires]
  )

  const handleFilterChange = (event) => {
    const { id, value } = event.target
    setDraftFilters((currentFilters) => ({ ...currentFilters, [id]: value }))

    if (filterError) {
      setFilterError('')
    }
  }

  const handleApplyFilters = () => {
    if (
      draftFilters.date_debut &&
      draftFilters.date_fin &&
      new Date(draftFilters.date_debut) > new Date(draftFilters.date_fin)
    ) {
      setFilterError('La date de debut doit etre anterieure ou egale a la date de fin.')
      return
    }

    setFilterError('')
    setAppliedFilters({ ...draftFilters })
  }

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_DEPENSE_FILTERS)
    setAppliedFilters(DEFAULT_DEPENSE_FILTERS)
    setFilterError('')
  }

  const hasDraftFilters = hasActiveDepenseFilters(draftFilters)
  const hasAppliedFilters = hasActiveDepenseFilters(appliedFilters)

  const filterPanel = (
    <section className='module-filter-panel paiement-filter-panel'>
      <div>
        <h2>Filtrer les sorties</h2>
        <p>
          Affichez toutes les sorties ou limitez les résultats par statut, categorie, mode,
          periode, annee scolaire, reference ou beneficiaire.
        </p>
      </div>

      <div className='module-filter-panel__fields paiement-filter-panel__fields'>
        <Input
          id='reference'
          type='search'
          label='Reference'
          placeholder='Reference'
          value={draftFilters.reference}
          disabled={isLoadingOptions}
          onChange={handleFilterChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleApplyFilters()
            }
          }}
        />
        <Input
          id='beneficiaire'
          type='search'
          label='Beneficiaire'
          placeholder='Beneficiaire'
          value={draftFilters.beneficiaire}
          disabled={isLoadingOptions}
          onChange={handleFilterChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleApplyFilters()
            }
          }}
        />
        <SelectField
          id='categorie'
          label='Categorie'
          value={draftFilters.categorie}
          options={CATEGORIE_DEPENSE_OPTIONS}
          placeholder='Toutes les categories'
          disabled={isLoadingOptions}
          onChange={handleFilterChange}
        />
        <SelectField
          id='statut'
          label='Statut'
          value={draftFilters.statut}
          options={STATUT_DEPENSE_OPTIONS}
          placeholder='Tous les statuts'
          disabled={isLoadingOptions}
          onChange={handleFilterChange}
        />
        <SelectField
          id='mode_paiement'
          label='Mode de paiement'
          value={draftFilters.mode_paiement}
          options={MODE_DEPENSE_OPTIONS}
          placeholder='Tous les modes'
          disabled={isLoadingOptions}
          onChange={handleFilterChange}
        />
        <Input
          id='date_debut'
          type='date'
          label='Date debut'
          placeholder='Date debut'
          value={draftFilters.date_debut}
          disabled={isLoadingOptions}
          onChange={handleFilterChange}
        />
        <Input
          id='date_fin'
          type='date'
          label='Date fin'
          placeholder='Date fin'
          value={draftFilters.date_fin}
          disabled={isLoadingOptions}
          onChange={handleFilterChange}
        />
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
        <div className='paiement-filter-panel__actions'>
          {hasDraftFilters && (
            <Button
              type='button'
              variant='ghost'
              label='Reinitialiser'
              disabled={isLoadingOptions}
              onClick={handleResetFilters}
              className='inscription-action inscription-action--secondary'
            />
          )}
          <Button
            type='button'
            variant='super'
            label='Appliquer les filtres'
            disabled={isLoadingOptions}
            onClick={handleApplyFilters}
            className='inscription-action inscription-action--primary'
          />
        </div>
      </div>

      {filterError && <Feedback type='error' message={filterError} />}
      {hasAppliedFilters && !filterError && (
        <Feedback type='info' message='Filtres appliques. Les resultats affiches viennent de la recherche serveur.' />
      )}
      {isLoadingOptions && <Loader message='Chargement des filtres...' />}
      {!isLoadingOptions && optionsError && (
        <div className='module-filter-panel__warning'>
          <Feedback type='warning' message={optionsError} />
          <Button
            type='button'
            variant='ghost'
            label='Reessayer'
            onClick={loadOptions}
            className='inscription-action inscription-action--secondary'
          />
        </div>
      )}
    </section>
  )

  return (
    <EntityListPage
      isLoadingDependencies={isLoadingOptions}
      title='Sorties'
      description='Consultez les sorties et suivez leur statut.'
      loadItems={loadDepenses}
      columns={columns}
      emptyMessage='Aucune sortie enregistrée.'
      createPath='/depenses/create'
      createLabel='Nouvelle sortie'
      getRowPath={(item) => `/depenses/${item.id}`}
      searchPlaceholder='Recherche rapide dans les sorties affichées'
      getSearchText={getDepenseSearchText}
      successMessage={location.state?.successMessage}
      beforePanel={filterPanel}
      socketEvents={{
        created: 'depense_created',
        updated: 'depense_updated',
        deleted: 'depense_deleted'
      }}
    />
  )
}

export default DepensesPage
