import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { getClasses } from '../../../services/classeService'
import { getInscriptions } from '../../../services/inscriptionService'
import { getPaiements, updatePaiementStatutCheque } from '../../../services/paiementService'
import { getStudents } from '../../../services/studentService'
import DetailField from '../../inscriptions/components/DetailField'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import SearchableSelectField from '../../inscriptions/components/SearchableSelectField'
import SelectField from '../../inscriptions/components/SelectField'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import {
  formatDate,
  getDesignation,
  getInscriptionAnnee,
  getInscriptionClasse,
  getInscriptionStudent,
  getStudentName,
  normalizeCollection,
} from '../../inscriptions/utils/data'
import { formatAmount } from '../../inscriptions/utils/amounts'
import {

  DEFAULT_PAIEMENT_FILTERS,
  getPaiementFilterParams,
  getInscriptionOptionLabel,
  getPaiementDate,
  getPaiementInscription,
  getPaiementModeLabel,
  getPaiementMontant,
  getPaiementMotifLabel,
  getPaiementSearchText,
  getPaiementStatus,
  hasActivePaiementFilters,
  MODE_PAIEMENT_OPTIONS,
  MOTIF_PAIEMENT_OPTIONS,
  STATUT_CHEQUE_PAIEMENT_OPTIONS,
  STATUT_PAIEMENT_OPTIONS,
} from '../utils/paiement'

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
    label: 'Inscription',
    render: (item) => {
      const inscription = getPaiementInscription(item)
      return inscription?.id ? `#${inscription.id}` : `#${item.inscription_id || '-'}`
    },
  },
  {
    label: 'Eleve',
    render: (item) => getStudentName(getInscriptionStudent(getPaiementInscription(item))),
  },
  {
    label: 'Montant',
    render: (item) => formatAmount(getPaiementMontant(item)),
  },
  {
    label: 'Motif',
    render: (item) => getPaiementMotifLabel(item.motif || item.type),
  },
  {
    label: 'Mode',
    render: (item) => getPaiementModeLabel(item.mode_paiement || item.modePaiement || item.mode),
  },
  {
    label: 'Statut',
    render: (item) => <StatusBadge value={getPaiementStatus(item)} />,
  },
  {
    label: 'Date',
    render: (item) => formatDate(getPaiementDate(item)),
  },
]

const PaiementsPage = () => {
  const location = useLocation()
  const [inscriptions, setInscriptions] = useState([])
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [draftFilters, setDraftFilters] = useState(DEFAULT_PAIEMENT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_PAIEMENT_FILTERS)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [filterError, setFilterError] = useState('')
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [chequeStatusModal, setChequeStatusModal] = useState({
    item: null,
    nextStatus: 'RECU',
    feedback: '',
    isSaving: false,
  })

  const applyOptionsResults = useCallback((inscriptionsResult, studentsResult, classesResult, anneesResult) => {
    if (inscriptionsResult.status === 'fulfilled') {
      setInscriptions(normalizeCollection(inscriptionsResult.value))
    }

    if (studentsResult.status === 'fulfilled') {
      setStudents(normalizeCollection(studentsResult.value))
    }

    if (classesResult.status === 'fulfilled') {
      setClasses(normalizeCollection(classesResult.value))
    }

    if (anneesResult.status === 'fulfilled') {
      setAnneesScolaires(normalizeCollection(anneesResult.value))
    }

    if (
      inscriptionsResult.status === 'rejected' ||
      studentsResult.status === 'rejected' ||
      classesResult.status === 'rejected' ||
      anneesResult.status === 'rejected'
    ) {
      setOptionsError('Certains filtres sont indisponibles. Rechargez les listes avant d appliquer un filtre.')
    }
  }, [])

  const loadOptions = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError('')

    const results = await Promise.allSettled([
      getInscriptions(),
      getStudents(),
      getClasses(),
      getAnneesScolaires(),
    ])

    applyOptionsResults(...results)
    setIsLoadingOptions(false)
  }, [applyOptionsResults])

  useEffect(() => {
    let isCancelled = false

    Promise.allSettled([
      getInscriptions(),
      getStudents(),
      getClasses(),
      getAnneesScolaires(),
    ])
      .then((results) => {
        if (!isCancelled) {
          applyOptionsResults(...results)
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
  }, [applyOptionsResults])

  const loadPaiements = useCallback(() => {
    return getPaiements(getPaiementFilterParams(appliedFilters))
  }, [appliedFilters, refreshNonce])

  const inscriptionOptions = useMemo(
    () => inscriptions.map((inscription) => ({
      value: inscription.id,
      label: getInscriptionOptionLabel(inscription),
      searchText: [
        getStudentName(getInscriptionStudent(inscription)),
        getDesignation(getInscriptionClasse(inscription)),
        getDesignation(getInscriptionAnnee(inscription)),
      ].join(' '),
    })),
    [inscriptions]
  )
  const studentOptions = useMemo(
    () => students.map((student) => ({
      value: student.id,
      label: getStudentName(student),
      searchText: student.contact || student.phone || '',
    })),
    [students]
  )
  const classeOptions = useMemo(
    () => classes.map((classe) => ({
      value: classe.id,
      label: getDesignation(classe, `Classe #${classe.id}`),
      searchText: classe.responsable || '',
    })),
    [classes]
  )
  const anneeOptions = useMemo(
    () => anneesScolaires.map((annee) => ({
      value: annee.id,
      label: getDesignation(annee, `Annee #${annee.id}`),
      searchText: annee.statut || '',
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
    setDraftFilters(DEFAULT_PAIEMENT_FILTERS)
    setAppliedFilters(DEFAULT_PAIEMENT_FILTERS)
    setFilterError('')
  }

  const hasDraftFilters = hasActivePaiementFilters(draftFilters)
  const hasAppliedFilters = hasActivePaiementFilters(appliedFilters)

  const openChequeStatusModal = (item) => {
    setChequeStatusModal({
      item,
      nextStatus: item.statut_cheque || 'RECU',
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
      nextStatus: 'RECU',
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
      await updatePaiementStatutCheque(chequeStatusModal.item.id, {
        statut_cheque: chequeStatusModal.nextStatus,
      })
      setRefreshNonce((value) => value + 1)
      setChequeStatusModal({
        item: null,
        nextStatus: 'RECU',
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
    const modePaiement = item.mode_paiement || item.modePaiement || item.mode

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
        <h2>Filtrer les entrées</h2>
        <p>
          Affichez toutes les entrées ou limitez les résultats par statut, motif, mode, période,
          inscription, élève, classe, année scolaire ou référence.
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
        <SelectField
          id='statut'
          label='Statut'
          value={draftFilters.statut}
          options={STATUT_PAIEMENT_OPTIONS}
          placeholder='Tous les statuts'
          disabled={isLoadingOptions}
          onChange={handleFilterChange}
        />
        <SelectField
          id='motif'
          label='Motif'
          value={draftFilters.motif}
          options={MOTIF_PAIEMENT_OPTIONS}
          placeholder='Tous les motifs'
          disabled={isLoadingOptions}
          onChange={handleFilterChange}
        />
        <SelectField
          id='mode_paiement'
          label='Mode de paiement'
          value={draftFilters.mode_paiement}
          options={MODE_PAIEMENT_OPTIONS}
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
          id='inscription_id'
          label='Inscription'
          value={draftFilters.inscription_id}
          options={inscriptionOptions}
          placeholder='Rechercher une inscription'
          emptyMessage='Aucune inscription ne correspond a votre recherche.'
          disabled={isLoadingOptions}
          onChange={handleFilterChange}
        />
        <SearchableSelectField
          id='student_id'
          label='Eleve'
          value={draftFilters.student_id}
          options={studentOptions}
          placeholder='Rechercher un eleve'
          emptyMessage='Aucun eleve ne correspond a votre recherche.'
          disabled={isLoadingOptions}
          onChange={handleFilterChange}
        />
        <SearchableSelectField
          id='class_id'
          label='Classe'
          value={draftFilters.class_id}
          options={classeOptions}
          placeholder='Rechercher une classe'
          emptyMessage='Aucune classe ne correspond a votre recherche.'
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
        title='Entrées'
        description='Consultez les entrées, filtrez les résultats et suivez leur statut.'
        loadItems={loadPaiements}
        columns={columns}
        emptyMessage='Aucune entrée enregistrée.'
        createPath='/paiements/create'
        createLabel='Nouvelle entrée'
        getRowPath={(item) => `/paiements/${item.id}`}
        searchPlaceholder='Recherche rapide dans les entrées affichées'
        getSearchText={getPaiementSearchText}
        successMessage={location.state?.successMessage}
        beforePanel={filterPanel}
        extraActions={renderChequeAction}
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
              <DetailField label='Montant' value={formatAmount(getPaiementMontant(chequeStatusItem))} />
              <DetailField label='Statut actuel' value={<StatusBadge value={chequeStatusItem.statut_cheque || '-'} />} />
            </dl>

            <SelectField
              id='paiement_statut_cheque'
              label='Nouveau statut'
              value={chequeStatusModal.nextStatus}
              options={STATUT_CHEQUE_PAIEMENT_OPTIONS}
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

export default PaiementsPage
