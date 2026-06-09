import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { getDepenses, updateDepenseStatutCheque } from '../../../services/depenseService'
import DetailField from '../../inscriptions/components/DetailField'
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
  STATUT_CHEQUE_OPTIONS,
  STATUT_DEPENSE_OPTIONS,
} from '../utils/depense'

const actionMenuButtonStyle = {
  width: '100%',
  padding: '10px 16px',
  border: 0,
  borderTop: '1px solid #f3f4f6',
  background: 'white',
  color: '#173f5f',
  fontFamily: 'var(--font-primary)',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  textAlign: 'left',
}

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
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [chequeStatusModal, setChequeStatusModal] = useState({
    item: null,
    nextStatus: 'EMIS',
    feedback: '',
    isSaving: false,
  })

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
  }, [appliedFilters, refreshNonce])

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

  const openChequeStatusModal = (item) => {
    setChequeStatusModal({
      item,
      nextStatus: item.statut_cheque || 'EMIS',
      feedback: '',
      isSaving: false,
    })
  }

  const closeChequeStatusModal = () => {
    if (chequeStatusModal.isSaving) {
      return
    }

    setChequeStatusModal({
      item: null,
      nextStatus: 'EMIS',
      feedback: '',
      isSaving: false,
    })
  }

  const handleChequeStatusChange = (event) => {
    setChequeStatusModal((current) => ({
      ...current,
      nextStatus: event.target.value,
      feedback: '',
    }))
  }

  const handleSaveChequeStatus = async (event) => {
    event.preventDefault()

    if (!chequeStatusModal.item) {
      return
    }

    setChequeStatusModal((current) => ({ ...current, feedback: '', isSaving: true }))

    try {
      await updateDepenseStatutCheque(chequeStatusModal.item.id, {
        statut_cheque: chequeStatusModal.nextStatus,
      })
      setRefreshNonce((value) => value + 1)
      setChequeStatusModal({
        item: null,
        nextStatus: 'EMIS',
        feedback: '',
        isSaving: false,
      })
    } catch (error) {
      setChequeStatusModal((current) => ({
        ...current,
        feedback: error.message || 'Impossible de changer le statut du cheque.',
        isSaving: false,
      }))
    }
  }

  const renderChequeAction = (item, actionContext = {}) => {
    const modePaiement = getDepenseModePaiement(item)

    if (modePaiement !== 'CHEQUE') {
      return null
    }

    return (
      <button
        type='button'
        style={actionMenuButtonStyle}
        onClick={() => {
          actionContext.closeMenu?.()
          openChequeStatusModal(item)
        }}
      >
        <RefreshCw size={16} />
        Changer statut du chèque
      </button>
    )
  }

  const chequeStatusItem = chequeStatusModal.item

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
    <>
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
      extraActions={renderChequeAction}
      socketEvents={{
        created: 'depense_created',
        updated: 'depense_updated',
        deleted: 'depense_deleted'
      }}
      />

      {chequeStatusItem && (
        <div className='cheque-status-dialog-backdrop' role='presentation'>
          <form className='cheque-status-dialog' onSubmit={handleSaveChequeStatus}>
            <header className='cheque-status-dialog__header'>
              <h2>Changer statut du chèque</h2>
            </header>

            {chequeStatusModal.feedback && (
              <Feedback type='error' message={chequeStatusModal.feedback} />
            )}

            <dl className='inscription-detail-grid cheque-status-dialog__summary'>
              <DetailField label='Numéro du chèque' value={chequeStatusItem.numero_cheque || '-'} />
              <DetailField label='Montant' value={formatAmount(getDepenseMontant(chequeStatusItem))} />
              <DetailField label='Statut actuel' value={<StatusBadge value={chequeStatusItem.statut_cheque || '-'} />} />
            </dl>

            <SelectField
              id='depense_statut_cheque'
              label='Nouveau statut'
              value={chequeStatusModal.nextStatus}
              options={STATUT_CHEQUE_OPTIONS}
              disabled={chequeStatusModal.isSaving}
              onChange={handleChequeStatusChange}
            />

            <div className='inscription-form-actions cheque-status-dialog__actions'>
              <Button
                type='button'
                variant='ghost'
                label='Annuler'
                disabled={chequeStatusModal.isSaving}
                onClick={closeChequeStatusModal}
                className='inscription-action inscription-action--secondary'
              />
              <Button
                type='submit'
                variant='super'
                label={chequeStatusModal.isSaving ? 'Enregistrement...' : 'Enregistrer'}
                loading={chequeStatusModal.isSaving}
                className='inscription-action inscription-action--primary'
              />
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export default DepensesPage
