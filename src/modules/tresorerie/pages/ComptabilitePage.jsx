import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Filter } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import FilterPanel from '../../../components/ui/FilterPanel'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import SearchableSelectField from '../../inscriptions/components/SearchableSelectField'
import Journal from '../components/reporting/Journal'
import Bilan from '../components/reporting/Bilan'
import Balance from '../components/reporting/Balance'
import GrandLivre from '../components/reporting/GrandLivre'
import {
  getDesignation,
  normalizeCollection,
} from '../../inscriptions/utils/data'
import {
  DEFAULT_TRESORERIE_FILTERS,
  validateTresorerieFilters,
} from '../utils/tresorerie'

const TABS = [
  { id: 'JOURNAL', label: 'Journal' },
  { id: 'GRAND_LIVRE', label: 'Grand Livre' },
  { id: 'BALANCE', label: 'Balance Générale' },
  { id: 'BILAN', label: 'Bilan Comptable' },
]

const DEFAULT_FILTERS = {
  ...DEFAULT_TRESORERIE_FILTERS,
  exercice_id: '',
  journal_id: '',
}

const ComptabilitePage = () => {
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)

  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [filterError, setFilterError] = useState('')

  const [activeTab, setActiveTab] = useState('JOURNAL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const loadAnnees = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError('')
    try {
      const payload = await getAnneesScolaires()
      setAnneesScolaires(normalizeCollection(payload))
    } catch (error) {
      setOptionsError(error.message || 'Impossible de charger les années scolaires.')
    } finally {
      setIsLoadingOptions(false)
    }
  }, [])

  useEffect(() => {
    loadAnnees()
  }, [loadAnnees])

  const anneeOptions = useMemo(
    () =>
      anneesScolaires.map(annee => ({
        value: annee.id,
        label: getDesignation(annee, `Annee #${annee.id}`),
        searchText: annee.statut || annee.status || '',
      })),
    [anneesScolaires]
  )

  const hasActiveFilters = Boolean(
    appliedFilters.annee_scolaire_id ||
    appliedFilters.start_date ||
    appliedFilters.end_date ||
    appliedFilters.exercice_id ||
    appliedFilters.journal_id
  )

  const handleFilterChange = (id, value) => {
    setDraftFilters(current => {
      const next = { ...current, [id]: value }

      // Annee scolaire et période sont mutuellement exclusifs
      if (id === 'annee_scolaire_id' && value) {
        next.start_date = ''
        next.end_date = ''
      }
      if ((id === 'start_date' || id === 'end_date') && value) {
        next.annee_scolaire_id = ''
      }

      return next
    })
    if (filterError) setFilterError('')
  }

  const handleApplyFilters = () => {
    const nextError = validateTresorerieFilters(draftFilters)
    if (nextError) {
      setFilterError(nextError)
      return
    }
    setFilterError('')
    setAppliedFilters({ ...draftFilters })
    setIsFilterOpen(false)
  }

  const handleClearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    setFilterError('')
  }

  return (
    <section className='inscription-page' style={{ padding: '12px' }}>
      {/* Header avec onglets et bouton filtre */}
      <header
        className='inscription-page-header'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        {/* Onglets */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <Button
              key={tab.id}
              label={tab.label}
              variant={activeTab === tab.id ? 'secondary' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={`inscription-action ${activeTab !== tab.id ? 'inscription-action--secondary' : ''}`}
            />
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasActiveFilters && (
            <span className='inscription-active-filter-badge'>Filtres actifs</span>
          )}
          <Button
            type='button'
            variant='outline'
            icon={<Filter size={16} />}
            label='Filtrer'
            onClick={() => setIsFilterOpen(true)}
            className='inscription-action inscription-action--secondary'
          />
        </div>
      </header>

      {/* Panneau de filtres */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      >
        {/* Filtre période */}
        <div className='filter-field'>
          <label>Période d'analyse</label>
          <div className='filter-field-row' style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <Input
                type='date'
                value={draftFilters.start_date}
                disabled={isLoadingOptions}
                onChange={e => handleFilterChange('start_date', e.target.value)}
                style={{ marginBottom: 0, width: '100%' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                type='date'
                value={draftFilters.end_date}
                disabled={isLoadingOptions}
                onChange={e => handleFilterChange('end_date', e.target.value)}
                style={{ marginBottom: 0, width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Filtre exercice comptable (ID manuel — à remplacer par un select si on ajoute la route) */}
        <div className='filter-field'>
          <label>ID Exercice comptable</label>
          <Input
            type='number'
            placeholder='Ex : 1'
            value={draftFilters.exercice_id}
            onChange={e => handleFilterChange('exercice_id', e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>

        {/* Filtre journal (ID manuel) */}
        <div className='filter-field'>
          <label>ID Journal comptable</label>
          <Input
            type='number'
            placeholder='Ex : 1 (CA=Caisse, BQ=Banque)'
            value={draftFilters.journal_id}
            onChange={e => handleFilterChange('journal_id', e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>

        {filterError && <Feedback type='error' message={filterError} />}
        {optionsError && (
          <div style={{ marginTop: '16px' }}>
            <Feedback type='warning' message={optionsError} />
          </div>
        )}
      </FilterPanel>

      {/* Contenu du rapport actif */}
      <div style={{ marginTop: '16px' }}>
        {activeTab === 'JOURNAL' && <Journal filters={appliedFilters} />}
        {activeTab === 'GRAND_LIVRE' && <GrandLivre filters={appliedFilters} />}
        {activeTab === 'BALANCE' && <Balance filters={appliedFilters} />}
        {activeTab === 'BILAN' && <Bilan filters={appliedFilters} />}
      </div>
    </section>
  )
}

export default ComptabilitePage
