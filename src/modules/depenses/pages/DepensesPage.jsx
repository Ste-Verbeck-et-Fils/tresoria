import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import FilterPanel from '../../../components/ui/FilterPanel'
import Input from '../../../components/ui/Input'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { getDepenses } from '../../../services/depenseService'
import { normalizeRole } from '../../../utils/roles'
import {
  formatDate,
  getDesignation,
  normalizeCollection,
} from '../../inscriptions/utils/data'
import { formatAmount } from '../../inscriptions/utils/amounts'
import {
  getDepenseAnneeScolaire,
  getDepenseBeneficiaire,
  getDepenseCategorie,
  getDepenseDate,
  getDepenseModePaiement,
  getDepenseMontant,
  getDepenseSearchText,
  getDepenseStatus,
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

  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : {}
  const normalizedUserRole = normalizeRole(user?.role)
  const isParent = normalizedUserRole === 'PARENT'
  const canCreate = !isParent

  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  const [filters, setFilters] = useState({
    statut: [],
    modePaiement: [],
    categorie: [],
    dateMin: '',
    dateMax: '',
    montantMin: '',
    montantMax: '',
    anneeScolaireId: '',
  })

  useEffect(() => {
    let isCancelled = false
    getAnneesScolaires()
      .then((payload) => {
        if (!isCancelled) {
          setAnneesScolaires(normalizeCollection(payload))
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleArrayToggle = (key, value) => {
    setFilters(prev => {
      const arr = prev[key]
      const isSelected = arr.includes(value)
      return {
        ...prev,
        [key]: isSelected ? arr.filter(v => v !== value) : [...arr, value]
      }
    })
  }

  const localFilter = (item) => {
    const status = getDepenseStatus(item)
    if (filters.statut.length > 0 && !filters.statut.includes(status)) return false

    const mode = item.mode_paiement || item.modePaiement || item.mode
    if (filters.modePaiement.length > 0 && !filters.modePaiement.includes(mode)) return false

    const categorie = item.categorie
    if (filters.categorie.length > 0 && !filters.categorie.includes(categorie)) return false

    const date = getDepenseDate(item)
    if (filters.dateMin || filters.dateMax) {
      if (date) {
        const itemDate = new Date(date)
        itemDate.setHours(0, 0, 0, 0)

        if (filters.dateMin) {
          const dMin = new Date(filters.dateMin)
          dMin.setHours(0, 0, 0, 0)
          if (itemDate < dMin) return false
        }
        if (filters.dateMax) {
          const dMax = new Date(filters.dateMax)
          dMax.setHours(0, 0, 0, 0)
          if (itemDate > dMax) return false
        }
      } else {
        return false
      }
    }

    const montant = parseFloat(getDepenseMontant(item))
    if (filters.montantMin || filters.montantMax) {
      if (filters.montantMin && montant < parseFloat(filters.montantMin)) return false
      if (filters.montantMax && montant > parseFloat(filters.montantMax)) return false
    }

    if (filters.anneeScolaireId) {
      const annee = getDepenseAnneeScolaire(item)
      if (!annee || annee.id.toString() !== filters.anneeScolaireId.toString()) return false
    }

    return true
  }

  const hasActiveFilters = filters.statut.length > 0 ||
    filters.modePaiement.length > 0 ||
    filters.categorie.length > 0 ||
    filters.dateMin !== '' ||
    filters.dateMax !== '' ||
    filters.montantMin !== '' ||
    filters.montantMax !== '' ||
    filters.anneeScolaireId !== ''

  const handleClearFilters = () => {
    setFilters({
      statut: [], modePaiement: [], categorie: [], dateMin: '', dateMax: '', montantMin: '', montantMax: '', anneeScolaireId: ''
    })
  }

  return (
    <EntityListPage
      isLoadingDependencies={isLoadingOptions}
      title='Sorties'
      description='Consultez les sorties et suivez leur statut.'
      loadItems={getDepenses}
      columns={columns}
      emptyMessage='Aucune sortie enregistrée.'
      createPath={canCreate ? '/depenses/create' : null}
      createLabel={canCreate ? 'Nouvelle sortie' : null}
      getRowPath={(item) => `/depenses/${item.id}`}
      searchPlaceholder='Recherche rapide dans les sorties affichées'
      getSearchText={getDepenseSearchText}
      successMessage={location.state?.successMessage}
      localFilter={localFilter}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      socketEvents={{
        created: 'depense_created',
        updated: 'depense_updated',
        deleted: 'depense_deleted'
      }}
      renderFilterPanel={({ isOpen, onClose }) => (
        <FilterPanel
          isOpen={isOpen}
          onClose={onClose}
          onApply={onClose}
          onClear={handleClearFilters}
        >
          <div className='filter-field'>
            <label>Statut</label>
            <select
              className='inscription-select'
              value={filters.statut[0] || ''}
              onChange={(e) => {
                const val = e.target.value
                setFilters(prev => ({ ...prev, statut: val ? [val] : [] }))
              }}
            >
              <option value=''>Tous les statuts</option>
              <option value='CONFIRME'>CONFIRME</option>
              <option value='EN_ATTENTE'>EN ATTENTE</option>
              <option value='ANNULE'>ANNULE</option>
            </select>
          </div>

          <div className='filter-field'>
            <label>Mode de paiement</label>
            <div className='filter-field-row' style={{ flexWrap: 'wrap', gap: '8px' }}>
              {['CASH', 'MOBILE_MONEY'].map(m => (
                <label className='filter-checkbox' key={m}>
                  <input type='checkbox' checked={filters.modePaiement.includes(m)} onChange={() => handleArrayToggle('modePaiement', m)} />
                  <span>{m.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className='filter-field'>
            <label>Catégorie</label>
            <select
              className='inscription-select'
              value={filters.categorie[0] || ''}
              onChange={(e) => {
                const val = e.target.value
                setFilters(prev => ({ ...prev, categorie: val ? [val] : [] }))
              }}
            >
              <option value=''>Toutes les catégories</option>
              <option value='SALAIRE'>SALAIRE</option>
              <option value='EQUIPEMENT'>EQUIPEMENT</option>
              <option value='ENTRETIEN'>ENTRETIEN</option>
              <option value='FOURNITURE'>FOURNITURE</option>
              <option value='EVENEMENT'>EVENEMENT</option>
              <option value='AUTRE'>AUTRE</option>
            </select>
          </div>

          <div className='filter-field'>
            <label>Période</label>
            <div className='filter-field-row' style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <Input
                  type='date'
                  value={filters.dateMin}
                  onChange={(e) => handleFilterChange('dateMin', e.target.value)}
                  style={{ marginBottom: 0, width: '1rem' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Input
                  type='date'
                  value={filters.dateMax}
                  onChange={(e) => handleFilterChange('dateMax', e.target.value)}
                  style={{ marginBottom: 0, width: '1rem' }}
                />
              </div>
            </div>
          </div>

          <div className='filter-field'>
            <label>Montant (Min - Max)</label>
            <div className='filter-field-row' style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <Input
                  type='number'
                  value={filters.montantMin}
                  onChange={(e) => handleFilterChange('montantMin', e.target.value)}
                  placeholder='Min'
                  min='0'
                  style={{ marginBottom: 0, width: '50%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Input
                  type='number'
                  value={filters.montantMax}
                  onChange={(e) => handleFilterChange('montantMax', e.target.value)}
                  placeholder='Max'
                  min='0'
                  style={{ marginBottom: 0, width: '50%' }}
                />
              </div>
            </div>
          </div>

          <div className='filter-field'>
            <label>Année scolaire</label>
            <select
              className='inscription-select'
              value={filters.anneeScolaireId}
              onChange={(e) => handleFilterChange('anneeScolaireId', e.target.value)}
            >
              <option value=''>Toutes les années</option>
              {anneesScolaires.map(a => (
                <option key={a.id} value={a.id}>{getDesignation(a)}</option>
              ))}
            </select>
          </div>
        </FilterPanel>
      )}
    />
  )
}

export default DepensesPage
