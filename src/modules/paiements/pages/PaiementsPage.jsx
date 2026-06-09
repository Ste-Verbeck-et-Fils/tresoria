import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import FilterPanel from '../../../components/ui/FilterPanel'
import Input from '../../../components/ui/Input'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { getPaiements } from '../../../services/paiementService'
import { normalizeRole } from '../../../utils/roles'
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
  getPaiementDate,
  getPaiementInscription,
  getPaiementModeLabel,
  getPaiementMontant,
  getPaiementMotifLabel,
  getPaiementSearchText,
  getPaiementStatus,
} from '../utils/paiement'

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

  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : {}
  const normalizedUserRole = normalizeRole(user?.role)
  // Conserver les contraintes : seul les rôles autorisés (ex: pas PARENT) peuvent créer.
  // Ajustez selon la logique stricte souhaitée.
  const isParent = normalizedUserRole === 'PARENT'
  const canCreate = !isParent

  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  const [filters, setFilters] = useState({
    status: [],
    modePaiement: [],
    motif: [],
    dateMin: '',
    dateMax: '',
    montantMin: '',
    montantMax: '',
    anneeScolaireId: '',
    classes: [],
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

  const abbreviateClass = (designation) => {
    if (!designation) return ''
    const d = designation.toLowerCase()
    let num = ''
    if (d.includes('1') || d.includes('premi')) num = '1'
    else if (d.includes('2') || d.includes('deux')) num = '2'
    else if (d.includes('3') || d.includes('trois')) num = '3'
    else if (d.includes('4') || d.includes('quatr')) num = '4'
    else if (d.includes('5') || d.includes('cinq')) num = '5'
    else if (d.includes('6') || d.includes('six')) num = '6'
    else if (d.includes('7') || d.includes('sept')) num = '7'
    else if (d.includes('8') || d.includes('huit')) num = '8'

    let type = ''
    if (d.includes('maternelle')) type = 'M'
    else if (d.includes('primaire')) type = 'P'
    else if (d.includes('secondaire') || d.includes('humanit')) type = 'S'

    if (num && type) return num + type
    return designation
  }

  const localFilter = (item) => {
    const status = getPaiementStatus(item)
    if (filters.status.length > 0 && !filters.status.includes(status)) return false

    const mode = item.mode_paiement || item.modePaiement || item.mode
    if (filters.modePaiement.length > 0 && !filters.modePaiement.includes(mode)) return false

    const motif = item.motif || item.type
    if (filters.motif.length > 0 && !filters.motif.includes(motif)) return false

    const date = getPaiementDate(item)
    if (filters.dateMin || filters.dateMax) {
      if (date) {
        const itemDate = new Date(date)
        // Normalize to midnight to avoid timezone issues when comparing date only
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

    const montant = parseFloat(getPaiementMontant(item))
    if (filters.montantMin || filters.montantMax) {
      if (filters.montantMin && montant < parseFloat(filters.montantMin)) return false
      if (filters.montantMax && montant > parseFloat(filters.montantMax)) return false
    }

    const inscription = getPaiementInscription(item)
    if (filters.anneeScolaireId) {
      const annee = getInscriptionAnnee(inscription)
      if (!annee || annee.id.toString() !== filters.anneeScolaireId.toString()) return false
    }

    if (filters.classes.length > 0) {
      const classe = getInscriptionClasse(inscription)
      if (!classe) return false
      const abbr = abbreviateClass(getDesignation(classe))
      if (!filters.classes.includes(abbr)) return false
    }

    return true
  }

  const hasActiveFilters = filters.status.length > 0 ||
    filters.modePaiement.length > 0 ||
    filters.motif.length > 0 ||
    filters.dateMin !== '' ||
    filters.dateMax !== '' ||
    filters.montantMin !== '' ||
    filters.montantMax !== '' ||
    filters.anneeScolaireId !== '' ||
    filters.classes.length > 0

  const handleClearFilters = () => {
    setFilters({
      status: [], modePaiement: [], motif: [], dateMin: '', dateMax: '', montantMin: '', montantMax: '', anneeScolaireId: '', classes: []
    })
  }

  const hardcodedClasses = ['1M', '2M', '3M', '1P', '2P', '3P', '4P', '5P', '6P', '1S', '2S', '3S', '4S', '5S', '6S']

  return (
    <EntityListPage
      isLoadingDependencies={isLoadingOptions}
      title='Entrées'
      description='Consultez les entrées, filtrez les résultats et suivez leur statut.'
      loadItems={getPaiements}
      columns={columns}
      emptyMessage='Aucune entrée enregistrée.'
      createPath={canCreate ? '/paiements/create' : null}
      createLabel={canCreate ? 'Nouvelle entrée' : null}
      getRowPath={(item) => `/paiements/${item.id}`}
      searchPlaceholder='Recherche rapide dans les entrées affichées'
      getSearchText={getPaiementSearchText}
      successMessage={location.state?.successMessage}
      localFilter={localFilter}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      socketEvents={{
        created: 'paiement_created',
        updated: 'paiement_updated',
        deleted: 'paiement_deleted'
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
              value={filters.status[0] || ''}
              onChange={(e) => {
                const val = e.target.value
                setFilters(prev => ({ ...prev, status: val ? [val] : [] }))
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
            <label>Motif de paiement</label>
            <select
              className='inscription-select'
              value={filters.motif[0] || ''}
              onChange={(e) => {
                const val = e.target.value
                setFilters(prev => ({ ...prev, motif: val ? [val] : [] }))
              }}
            >
              <option value=''>Tous les motifs</option>
              <option value='FRAIS_TRANSPORT'>FRAIS TRANSPORT</option>
              <option value='FRAIS_SCOLAIRE'>FRAIS SCOLAIRE</option>
              <option value='FRAIS_ETAT'>FRAIS ETAT</option>
              <option value='FRAIS_ETUDE'>FRAIS ETUDE</option>
              <option value='AUTRE'>AUTRE</option>
            </select>
          </div>

          <div className='filter-field'>
            <label>Période de paiement</label>
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
            <label>Total payé (Min - Max)</label>
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

          <div className='filter-field'>
            <label>Classes</label>
            <div className='filter-field-row' style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
              {hardcodedClasses.map(c => (
                <label className='filter-checkbox' key={c} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type='checkbox' checked={filters.classes.includes(c)} onChange={() => handleArrayToggle('classes', c)} />
                  <span style={{ fontSize: '0.85rem' }}>{c}</span>
                </label>
              ))}
            </div>
          </div>
        </FilterPanel>
      )}
    />
  )
}

export default PaiementsPage
