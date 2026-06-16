import React, { useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import FilterPanel from '../../../components/ui/FilterPanel'
import Input from '../../../components/ui/Input'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import { getTransferts } from '../../../services/transfertService'
import { formatDate, normalizeCollection } from '../../inscriptions/utils/data'
import { formatAmount } from '../../inscriptions/utils/amounts'
import { normalizeRole } from '../../../utils/roles'

const columns = [
  { label: 'Reference', render: (item) => item.reference || `#${item.id}` },
  { label: 'Date', render: (item) => formatDate(item.date_mouvement) },
  { label: 'Source', render: (item) => item.compte_source?.nom || '-' },
  { label: 'Destination', render: (item) => item.compte_destination?.nom || '-' },
  { label: 'Montant', render: (item) => formatAmount(item.montant) },
  { label: 'Statut', render: (item) => <StatusBadge value={item.statut} /> },
  { label: 'Créé par', render: (item) => item.creator?.full_name || item.creator?.phone || '-' },
]

const TransfertsPage = () => {
  const location = useLocation()

  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : {}
  const normalizedUserRole = normalizeRole(user?.role)
  const isParent = normalizedUserRole === 'PARENT'
  const canCreate = !isParent // Seuls les rôles autorisés (ADMIN, SUPER_ADMIN, COMPTABLE) peuvent créer

  const [usersOptions, setUsersOptions] = useState([])

  const loadItems = useCallback(async () => {
    const response = await getTransferts()
    const items = normalizeCollection(response)

    const uMap = new Map()

    items.forEach(t => {
      if (t.creator) uMap.set(t.creator.id, t.creator.full_name || t.creator.phone)
    })

    setUsersOptions(Array.from(uMap.entries()).map(([id, name]) => ({ value: id.toString(), label: name })))

    return response
  }, [])

  const [filters, setFilters] = useState({
    status: [],
    dateMin: '',
    dateMax: '',
    montantMin: '',
    montantMax: '',
    source: '',
    destination: '',
    creator: ''
  })

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const localFilter = (item) => {
    if (filters.status.length > 0 && !filters.status.includes(item.statut)) return false

    if (filters.dateMin || filters.dateMax) {
      if (item.date_mouvement) {
        const itemDate = new Date(item.date_mouvement)
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

    const montant = parseFloat(item.montant)
    if (filters.montantMin || filters.montantMax) {
      if (filters.montantMin && montant < parseFloat(filters.montantMin)) return false
      if (filters.montantMax && montant > parseFloat(filters.montantMax)) return false
    }

    if (filters.source) {
      const sName = item.compte_source?.nom
      const sType = item.compte_source?.type
      let matched = false
      if (filters.source === 'Banque' && sName === 'Banque') matched = true
      else if (filters.source === 'Caisse' && sType === 'CAISSE' && sName !== 'Banque') matched = true
      else if (filters.source === 'Mobile Money' && sType === 'MOBILE_MONEY') matched = true

      if (!matched) return false
    }

    if (filters.destination) {
      const dName = item.compte_destination?.nom
      const dType = item.compte_destination?.type
      let matched = false
      if (filters.destination === 'Banque' && dName === 'Banque') matched = true
      else if (filters.destination === 'Caisse' && dType === 'CAISSE' && dName !== 'Banque') matched = true
      else if (filters.destination === 'Mobile Money' && dType === 'MOBILE_MONEY') matched = true

      if (!matched) return false
    }

    if (filters.creator && item.creator?.id?.toString() !== filters.creator) {
      return false
    }

    return true
  }

  const hasActiveFilters = filters.status.length > 0 ||
    filters.dateMin !== '' ||
    filters.dateMax !== '' ||
    filters.montantMin !== '' ||
    filters.montantMax !== '' ||
    filters.source !== '' ||
    filters.destination !== '' ||
    filters.creator !== ''

  const handleClearFilters = () => {
    setFilters({
      status: [], dateMin: '', dateMax: '', montantMin: '', montantMax: '', source: '', destination: '', creator: ''
    })
  }

  const getSearchText = (item) => {
    return [
      item.reference,
      item.compte_source?.nom,
      item.compte_destination?.nom,
      item.montant,
      item.description,
      item.creator?.full_name,
      item.creator?.phone
    ].filter(Boolean).join(' ').toLowerCase()
  }

  return (
    <EntityListPage
      title='Transferts Internes'
      description='Consultez et gérez les transferts entre les comptes de trésorerie.'
      loadItems={loadItems}
      columns={columns}
      emptyMessage='Aucun transfert enregistré.'
      createPath={canCreate ? '/tresorerie/transferts/create' : null}
      createLabel={canCreate ? 'Ajouter un mouvement interne' : null}
      getRowPath={(item) => `/tresorerie/transferts/${item.id}`} // Navigate to details
      searchPlaceholder='Recherche rapide par réf, description, compte, créateur...'
      getSearchText={getSearchText}
      successMessage={location.state?.successMessage}
      localFilter={localFilter}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      renderFilterPanel={({ isOpen, onClose }) => (
        <FilterPanel
          isOpen={isOpen}
          onClose={onClose}
          onApply={onClose}
          onClear={handleClearFilters}
        >
          <div className='filter-field'>
            <label>Compte source</label>
            <select
              className='inscription-select'
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
            >
              <option value=''>Tous les comptes</option>
              <option value='Banque'>Banque</option>
              <option value='Caisse'>Caisse</option>
              <option value='Mobile Money'>Mobile Money</option>
            </select>
          </div>

          <div className='filter-field'>
            <label>Compte destination</label>
            <select
              className='inscription-select'
              value={filters.destination}
              onChange={(e) => handleFilterChange('destination', e.target.value)}
            >
              <option value=''>Tous les comptes</option>
              <option value='Banque'>Banque</option>
              <option value='Caisse'>Caisse</option>
              <option value='Mobile Money'>Mobile Money</option>
            </select>
          </div>

          <div className='filter-field'>
            <label>Créé par</label>
            <select
              className='inscription-select'
              value={filters.creator}
              onChange={(e) => handleFilterChange('creator', e.target.value)}
            >
              <option value=''>Tous les utilisateurs</option>
              {usersOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className='filter-field'>
            <label>Statut</label>
            <select
              className='inscription-select'
              value={filters.status[0] || ''}
              onChange={(e) => {
                const val = e.target.value
                setFilters(prev => ({ ...prev, status: val ? [val] : [] }))
              }}
            >
              <option value=''>Tous les statuts</option>
              <option value='CONFIRME'>CONFIRME</option>
              <option value='ANNULE'>ANNULE</option>
            </select>
          </div>

          <div className='filter-field'>
            <label>Période</label>
            <div className='filter-field-row' style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Input
                  type='date'
                  value={filters.dateMin}
                  onChange={(e) => handleFilterChange('dateMin', e.target.value)}
                  style={{ marginBottom: 0, width: '100%' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Input
                  type='date'
                  value={filters.dateMax}
                  onChange={(e) => handleFilterChange('dateMax', e.target.value)}
                  style={{ marginBottom: 0, width: '100%' }}
                />
              </div>
            </div>
          </div>

          <div className='filter-field'>
            <label>Montant (Min - Max)</label>
            <div className='filter-field-row' style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Input
                  type='number'
                  value={filters.montantMin}
                  onChange={(e) => handleFilterChange('montantMin', e.target.value)}
                  placeholder='Min'
                  min='0'
                  style={{ marginBottom: 0, width: '100%' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Input
                  type='number'
                  value={filters.montantMax}
                  onChange={(e) => handleFilterChange('montantMax', e.target.value)}
                  placeholder='Max'
                  min='0'
                  style={{ marginBottom: 0, width: '100%' }}
                />
              </div>
            </div>
          </div>
        </FilterPanel>
      )}
    />
  )
}

export default TransfertsPage
