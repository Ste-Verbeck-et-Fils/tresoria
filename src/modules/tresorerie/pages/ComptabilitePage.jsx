import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Filter } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import FilterPanel from '../../../components/ui/FilterPanel'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import SearchableSelectField from '../../inscriptions/components/SearchableSelectField'
import Bilan from '../components/reporting/Bilan'
import Balance from '../components/reporting/Balance'
import GrandLivre from '../components/reporting/GrandLivre'
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

const ComptabilitePage = () => {
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [draftFilters, setDraftFilters] = useState(DEFAULT_TRESORERIE_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_TRESORERIE_FILTERS)

  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [filterError, setFilterError] = useState('')

  const [rapportTab, setRapportTab] = useState('GRAND_LIVRE')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

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

  const hasActiveFilters = Boolean(
    appliedFilters.annee_scolaire_id ||
    appliedFilters.start_date ||
    appliedFilters.end_date
  )

  const handleFilterChange = (id, value) => {
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
    setAppliedFilters({ ...draftFilters })
    setIsFilterOpen(false)
  }

  const handleClearFilters = () => {
    setDraftFilters(DEFAULT_TRESORERIE_FILTERS)
    setAppliedFilters(DEFAULT_TRESORERIE_FILTERS)
    setFilterError('')
  }

  return (
    <section className='inscription-page' style={{ padding: '12px' }}>
      <header className='inscription-page-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button
            label="Grand Livre"
            variant={rapportTab === 'GRAND_LIVRE' ? 'secondary' : 'outline'}
            onClick={() => setRapportTab('GRAND_LIVRE')}
            className={`inscription-action ${rapportTab !== 'GRAND_LIVRE' ? 'inscription-action--secondary' : ''}`}
          />
          <Button
            label="Balance Générale"
            variant={rapportTab === 'BALANCE' ? 'secondary' : 'outline'}
            onClick={() => setRapportTab('BALANCE')}
            className={`inscription-action ${rapportTab !== 'BALANCE' ? 'inscription-action--secondary' : ''}`}
          />
          <Button
            label="Bilan Comptable"
            variant={rapportTab === 'BILAN' ? 'secondary' : 'outline'}
            onClick={() => setRapportTab('BILAN')}
            className={`inscription-action ${rapportTab !== 'BILAN' ? 'inscription-action--secondary' : ''}`}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasActiveFilters && (
            <span className='inscription-active-filter-badge'>
              Filtres actifs
            </span>
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

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      >
        <div className='filter-field'>
          <label>Annee scolaire</label>
          <SearchableSelectField
            id='annee_scolaire_id'
            value={draftFilters.annee_scolaire_id}
            options={anneeOptions}
            placeholder='Rechercher une annee scolaire'
            emptyMessage='Aucune annee scolaire ne correspond a votre recherche.'
            disabled={isLoadingOptions}
            onChange={(e) => handleFilterChange('annee_scolaire_id', e.target.value)}
          />
        </div>

        <div className='filter-field'>
          <label>Période d'analyse</label>
          <div className='filter-field-row' style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <Input
                type='date'
                value={draftFilters.start_date}
                disabled={isLoadingOptions}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                style={{ marginBottom: 0, width: '100%' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                type='date'
                value={draftFilters.end_date}
                disabled={isLoadingOptions}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                style={{ marginBottom: 0, width: '100%' }}
              />
            </div>
          </div>
        </div>

        {filterError && <Feedback type='error' message={filterError} />}
        {optionsError && (
          <div style={{ marginTop: '16px' }}>
            <Feedback type='warning' message={optionsError} />
          </div>
        )}
      </FilterPanel>

      <div style={{ marginTop: '16px' }}>
        {rapportTab === 'GRAND_LIVRE' && <GrandLivre filters={appliedFilters} />}
        {rapportTab === 'BALANCE' && <Balance filters={appliedFilters} />}
        {rapportTab === 'BILAN' && <Bilan />}
      </div>
    </section>
  )
}

export default ComptabilitePage
