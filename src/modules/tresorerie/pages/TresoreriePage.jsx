import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Filter } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import FilterPanel from '../../../components/ui/FilterPanel'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { getTresorerieDashboard } from '../../../services/tresorerieService'
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

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

const TresoreriePage = () => {
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

  const [activeTab, setActiveTab] = useState('COURANTE')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    setLoadError('')
    setIsForbidden(false)
    setDashboardData(null)
    setIsLoading(true)
    setAppliedFilters({ ...draftFilters })
    setIsFilterOpen(false)
  }

  const handleClearFilters = () => {
    setDraftFilters(DEFAULT_TRESORERIE_FILTERS)
    setAppliedFilters(DEFAULT_TRESORERIE_FILTERS)
    setFilterError('')
    setLoadError('')
    setIsForbidden(false)
    setDashboardData(null)
    setIsLoading(true)
  }

  const renderCard = (title, amount, isTotal = false) => (
    <div style={{
      background: isTotal ? 'var(--color-primary)' : 'var(--color-surface)',
      color: isTotal ? 'var(--color-background)' : 'var(--color-text-primary)',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: '200px',
      flex: 1,
      border: isTotal ? 'none' : '1px solid var(--color-border)'
    }}
    >
      <span style={{ fontSize: '0.9rem', color: isTotal ? 'var(--color-background)' : 'var(--color-text-muted)' }}>{title}</span>
      <strong style={{ fontSize: '1.8rem', fontWeight: 700 }}>{formatAmount(amount)}</strong>
    </div>
  )

  const renderChart = (labels, entreesData, sortiesData, chartTitle) => {
    const data = {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Sorties',
          data: sortiesData,
          borderColor: '#111827', // Dark contrast color for line
          backgroundColor: '#111827',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointBackgroundColor: '#111827',
        },
        {
          type: 'bar',
          label: 'Entrées',
          data: entreesData,
          backgroundColor: '#C6F53D', // Primary color
        },
      ],
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: !!chartTitle,
          text: chartTitle,
        },
      },
      scales: {
        y: {
          beginAtZero: true
        }
      },
    }

    return (
      <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', height: '400px', marginTop: '24px' }}>
        <Chart type='bar' options={options} data={data} />
      </div>
    )
  }

  const renderActiveTabContent = () => {
    if (!dashboardData) return null

    if (activeTab === 'COURANTE') {
      const labels = []
      const entreesData = []
      const sortiesData = []

      dashboardData.entreesParCategorie?.forEach(e => {
        if (!labels.includes(e.categorie)) labels.push(e.categorie)
      })
      dashboardData.sortiesParCategorie?.forEach(s => {
        if (!labels.includes(s.categorie)) labels.push(s.categorie)
      })

      labels.forEach(label => {
        const e = dashboardData.entreesParCategorie?.find(x => x.categorie === label)
        const s = dashboardData.sortiesParCategorie?.find(x => x.categorie === label)
        entreesData.push(e ? e.montant : 0)
        sortiesData.push(s ? s.montant : 0)
      })

      return (
        <div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            {renderCard('Entrées', dashboardData.vueCourante.entreesComptabilisables)}
            {renderCard('Sorties', dashboardData.vueCourante.sortiesConfirmees)}
            {renderCard('Solde Courant', dashboardData.vueCourante.soldeTresorerie, true)}
          </div>
          {renderChart(labels, entreesData, sortiesData, 'Comparaison par catégorie (Vue courante)')}
        </div>
      )
    }

    if (activeTab === 'GLOBAL') {
      return (
        <div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            {renderCard('Total Entrées', dashboardData.resumeGlobal.entreesComptabilisables)}
            {renderCard('Total Sorties', dashboardData.resumeGlobal.sortiesConfirmees)}
            {renderCard('Solde Global', dashboardData.resumeGlobal.soldeTresorerie, true)}
          </div>
          {renderChart(['Global'], [dashboardData.resumeGlobal.entreesComptabilisables], [dashboardData.resumeGlobal.sortiesConfirmees], 'Bilan Global (Toutes périodes)')}
        </div>
      )
    }

    if (activeTab === 'SOLDE') {
      const data = {
        labels: ['Caisse', 'Mobile Money'],
        datasets: [
          {
            type: 'bar',
            label: 'Solde Réel',
            data: [dashboardData.soldesReels.caisse, dashboardData.soldesReels.mobileMoney],
            backgroundColor: '#C6F53D', // Primary Color
          }
        ],
      }
      return (
        <div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            {renderCard('Caisse', dashboardData.soldesReels.caisse)}
            {renderCard('Mobile Money', dashboardData.soldesReels.mobileMoney)}
            {renderCard('Solde Total Disponible', dashboardData.soldesReels.soldeDisponible, true)}
          </div>
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', height: '400px', marginTop: '24px' }}>
            <Chart type='bar' options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: 'Répartition des soldes réels' } }, scales: { y: { beginAtZero: true } } }} data={data} />
          </div>
        </div>
      )
    }

    if (activeTab === 'TRANSPORT') {
      return (
        <div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            {renderCard('Entrées Transport', dashboardData.transport.entreesTransport)}
            {renderCard('Sorties Transport', dashboardData.transport.sortiesTransport)}
            {renderCard('Solde Transport', dashboardData.transport.soldeTransport, true)}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {renderCard('Chauffeur', dashboardData.transport.detailsSorties.chauffeur)}
            {renderCard('Carburant', dashboardData.transport.detailsSorties.carburant)}
            {renderCard('Entretien', dashboardData.transport.detailsSorties.entretien)}
          </div>

          {renderChart(
            ['Transport'],
            [dashboardData.transport.entreesTransport],
            [dashboardData.transport.sortiesTransport],
            'Bilan Transport'
          )}
        </div>
      )
    }

    return null
  }

  const tabStyle = (isActive) => ({
    padding: '12px 24px',
    background: isActive ? 'var(--color-primary)' : 'transparent',
    color: isActive ? 'var(--color-background)' : 'var(--color-text-primary)',
    border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
    borderRadius: '30px',
    cursor: 'pointer',
    fontWeight: isActive ? 600 : 500,
    boxShadow: isActive ? '0 2px 8px rgba(198, 245, 61, 0.4)' : 'none',
    transition: 'all 0.2s ease',
  })

  return (
    <section className='inscription-page' style={{ padding: '24px' }}>
      <header className='inscription-page-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button style={tabStyle(activeTab === 'COURANTE')} onClick={() => setActiveTab('COURANTE')}>Vue courante</button>
          <button style={tabStyle(activeTab === 'GLOBAL')} onClick={() => setActiveTab('GLOBAL')}>Résumé global</button>
          <button style={tabStyle(activeTab === 'SOLDE')} onClick={() => setActiveTab('SOLDE')}>Solde disponible</button>
          <button style={tabStyle(activeTab === 'TRANSPORT')} onClick={() => setActiveTab('TRANSPORT')}>Résumé transport</button>
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            {activeTab === 'COURANTE' && <h2>Vue courante - {scopeLabel}</h2>}
            {activeTab === 'GLOBAL' && <h2>Résumé global - Toutes périodes</h2>}
            {activeTab === 'SOLDE' && <h2>Soldes réels disponibles</h2>}
            {activeTab === 'TRANSPORT' && <h2>Résumé Transport</h2>}
          </div>

          {renderActiveTabContent()}
        </div>
      )}
    </section>
  )
}

export default TresoreriePage
