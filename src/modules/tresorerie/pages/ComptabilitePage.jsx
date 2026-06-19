import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Filter } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import FilterPanel from '../../../components/ui/FilterPanel'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { getPlanComptable } from '../../../services/comptabiliteService'
import SearchableSelectField from '../../inscriptions/components/SearchableSelectField'
import Journal from '../components/reporting/Journal'
import Bilan from '../components/reporting/Bilan'
import Balance from '../components/reporting/Balance'
import GrandLivre from '../components/reporting/GrandLivre'
import RapportJournalier from '../components/reporting/RapportJournalier'
import {
  getDesignation,
  normalizeCollection,
} from '../../inscriptions/utils/data'
import {
  DEFAULT_TRESORERIE_FILTERS,
  validateTresorerieFilters,
} from '../utils/tresorerie'

const TABS = [
  { id: 'RAPPORT_JOURNALIER', label: 'Rapport Journalier' },
  { id: 'JOURNAL', label: 'Journal' },
  { id: 'GRAND_LIVRE', label: 'Grand Livre' },
  { id: 'BALANCE', label: 'Balance Générale' },
  { id: 'BILAN', label: 'Bilan Comptable' },
]

const DEFAULT_FILTERS = {
  ...DEFAULT_TRESORERIE_FILTERS,
  compte_id: '',
}

const ComptabilitePage = () => {
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [comptes, setComptes] = useState([])
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)

  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [filterError, setFilterError] = useState('')

  const [activeTab, setActiveTab] = useState('RAPPORT_JOURNALIER')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const loadAnnees = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError('')
    try {
      const payload = await getAnneesScolaires()
      setAnneesScolaires(normalizeCollection(payload))
      const comptesPayload = await getPlanComptable()
      setComptes(normalizeCollection(comptesPayload))
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

  const compteOptions = useMemo(
    () =>
      comptes.map(compte => ({
        value: compte.id,
        label: `${compte.numero} - ${compte.intitule}`,
        searchText: `${compte.numero} ${compte.intitule}`,
      })),
    [comptes]
  )

  const hasActiveFilters = Boolean(
    appliedFilters.annee_scolaire_id ||
    appliedFilters.start_date ||
    appliedFilters.end_date
  )

  const handleFilterChange = (id, value) => {
    setDraftFilters(current => {
      const next = { ...current, [id]: value }

      // Plus de filtres mutuellement exclusifs comme demandé
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
    setDraftFilters({ ...DEFAULT_FILTERS, compte_id: appliedFilters.compte_id })
    setAppliedFilters({ ...DEFAULT_FILTERS, compte_id: appliedFilters.compte_id })
    setFilterError('')
  }

  const handleCompteChange = (value) => {
    setAppliedFilters(current => ({ ...current, compte_id: value }))
    setDraftFilters(current => ({ ...current, compte_id: value }))
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

        {/* Filtre Année Scolaire */}
        <div className='filter-field'>
          <label>Année Scolaire</label>
          <select
            value={draftFilters.annee_scolaire_id}
            onChange={e => handleFilterChange('annee_scolaire_id', e.target.value)}
            disabled={isLoadingOptions}
            className='inscription-input'
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
          >
            <option value=''>Toutes les années scolaires</option>
            {anneeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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
        {activeTab === 'RAPPORT_JOURNALIER' && (
          <RapportJournalier
            filters={appliedFilters}
          />
        )}
        {activeTab === 'JOURNAL' && (
          <Journal
            filters={appliedFilters}
            compteOptions={compteOptions}
            onCompteChange={handleCompteChange}
          />
        )}
        {activeTab === 'GRAND_LIVRE' && (
          <GrandLivre
            filters={appliedFilters}
            compteOptions={compteOptions}
            onCompteChange={handleCompteChange}
          />
        )}
        {activeTab === 'BALANCE' && (
          <Balance
            filters={appliedFilters}
            compteOptions={compteOptions}
            onCompteChange={handleCompteChange}
          />
        )}
        {activeTab === 'BILAN' && (
          <Bilan
            filters={appliedFilters}
            compteOptions={compteOptions}
            onCompteChange={handleCompteChange}
          />
        )}
      </div>
    </section>
  )
}

export default ComptabilitePage
