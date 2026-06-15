import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import { getStudents } from '../../../services/studentService'
import { formatDate, getStudentName } from '../../inscriptions/utils/data'
import { normalizeRole } from '../../../utils/roles'
import FilterPanel from '../../../components/ui/FilterPanel'
import Input from '../../../components/ui/Input'

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Nom complet', render: (item) => getStudentName(item) },
  { label: 'Sexe', render: (item) => item.sexe || '-' },
  { label: 'Date de naissance', render: (item) => formatDate(item.date_naissance) },
  { label: 'Contact', render: (item) => item.contact || '-' },
]

const StudentsPage = () => {
  const location = useLocation()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : {}
  const normalizedUserRole = normalizeRole(user?.role)
  const isParent = normalizedUserRole === 'PARENT'
  const isComptable = normalizedUserRole === 'COMPTABLE'
  const canCreate = !isParent && !isComptable

  const [filters, setFilters] = useState({
    sexe: [],
    province_origine: '',
    territoire_origine: '',
    quartier: '',
    ageMin: '',
    ageMax: '',
    inscrits: false
  })

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSexeToggle = (sexe) => {
    setFilters(prev => {
      const isSelected = prev.sexe.includes(sexe)
      return {
        ...prev,
        sexe: isSelected ? prev.sexe.filter(s => s !== sexe) : [...prev.sexe, sexe]
      }
    })
  }

  const localFilter = (item) => {
    if (filters.sexe.length > 0 && !filters.sexe.includes(item.sexe)) return false

    if (filters.province_origine && !item.province_origine?.toLowerCase().includes(filters.province_origine.toLowerCase())) return false
    if (filters.territoire_origine && !item.territoire_origine?.toLowerCase().includes(filters.territoire_origine.toLowerCase())) return false

    // Quartier (assuming it's in the first adresse if nested, or as a property. If missing, we skip filtering or filter out)
    if (filters.quartier) {
      const quartierStr = item.adresse?.[0]?.quartier || item.quartier || ''
      if (!quartierStr.toLowerCase().includes(filters.quartier.toLowerCase())) return false
    }

    if (filters.inscrits) {
      if (!item.inscriptions || item.inscriptions.length === 0) return false
    }

    if (filters.ageMin || filters.ageMax) {
      if (item.date_naissance) {
        const birthDate = new Date(item.date_naissance)
        const ageDifMs = Date.now() - birthDate.getTime()
        const ageDate = new Date(ageDifMs)
        const age = Math.abs(ageDate.getUTCFullYear() - 1970)

        if (filters.ageMin && age < parseInt(filters.ageMin)) return false
        if (filters.ageMax && age > parseInt(filters.ageMax)) return false
      } else {
        return false // If age filter is applied but no birthdate, filter out
      }
    }

    return true
  }

  return (
    <EntityListPage
      title='Eleves'
      loadItems={getStudents}
      columns={columns}
      emptyMessage='Aucun eleve enregistre.'
      createPath={null}
      createLabel={null}
      getRowPath={(item) => `/students/${item.id}`}
      searchPlaceholder='Rechercher un eleve'
      getSearchText={(item) => [
        item.id,
        item.nom,
        item.postnom,
        item.prenom,
        item.sexe,
        item.contact,
      ].join(' ')}
      extraActions={(item) => (
        <Link to={`/students/${item.id}/paiements`} style={{ padding: '10px 16px', textDecoration: 'none', color: '#173f5f', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #f3f4f6' }}>
          <CreditCard size={16} /> Paiement
        </Link>
      )}
      successMessage={location.state?.successMessage}
      localFilter={localFilter}
      renderFilterPanel={({ isOpen, onClose }) => (
        <FilterPanel
          isOpen={isOpen}
          onClose={onClose}
          onApply={onClose}
          onClear={() => setFilters({
            sexe: [], province_origine: '', territoire_origine: '', quartier: '', ageMin: '', ageMax: '', inscrits: false
          })}
        >
          <div className='filter-field'>
            <label>Sexe</label>
            <div className='filter-field-row'>
              <label className='filter-checkbox'>
                <input type='checkbox' checked={filters.sexe.includes('MASCULIN')} onChange={() => handleSexeToggle('MASCULIN')} />
                <span>Masculin</span>
              </label>
              <label className='filter-checkbox'>
                <input type='checkbox' checked={filters.sexe.includes('FEMININ')} onChange={() => handleSexeToggle('FEMININ')} />
                <span>Féminin</span>
              </label>
            </div>
          </div>
          <Input
            label="Province d'origine"
            value={filters.province_origine}
            onChange={(e) => handleFilterChange('province_origine', e.target.value)}
            placeholder="Province d'origine"
          />
          <Input
            label="Territoire d'origine"
            value={filters.territoire_origine}
            onChange={(e) => handleFilterChange('territoire_origine', e.target.value)}
            placeholder="Territoire d'origine"
          />
          <Input
            label='Quartier'
            value={filters.quartier}
            onChange={(e) => handleFilterChange('quartier', e.target.value)}
            placeholder='Quartier'
          />
          <div className='filter-field'>
            <label>Âge (ans)</label>
            <div className='filter-field-row'>
              <Input
                type='number'
                value={filters.ageMin}
                onChange={(e) => handleFilterChange('ageMin', e.target.value)}
                placeholder='Min'
                min='0'
                style={{ marginBottom: 0, width: '50%' }}
              />
              <Input
                type='number'
                value={filters.ageMax}
                onChange={(e) => handleFilterChange('ageMax', e.target.value)}
                placeholder='Max'
                min='0'
                style={{ marginBottom: 0, width: '50%' }}
              />
            </div>
          </div>
        </FilterPanel>
      )}
    />
  )
}

export default StudentsPage
