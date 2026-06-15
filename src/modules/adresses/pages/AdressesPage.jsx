import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import FilterPanel from '../../../components/ui/FilterPanel'
import SelectField from '../../inscriptions/components/SelectField'
import { normalizeCollection } from '../../inscriptions/utils/data'
import {
  getAdresses,
  getParentAdresses,
  getStudentAdresses,
} from '../../../services/adresseService'
import { getParents } from '../../../services/parentService'
import { getStudents } from '../../../services/studentService'
import {

  getAdresseOwnerName,
  getAdresseText,
  getOwnerOptions,
  OWNER_TYPE_OPTIONS,
} from '../utils/adresse'

const getColumns = (parents, students) => [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Associee a', render: (item) => getAdresseOwnerName(item, parents, students) },
  { label: 'Commune', render: (item) => item.commune || '-' },
  { label: 'Quartier', render: (item) => item.quartier || '-' },
  { label: 'Avenue', render: (item) => item.avenue || '-' },
  { label: 'Numero', render: (item) => item.numero || '-' },
]

const AdressesPage = () => {
  const location = useLocation()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : {}
  const isParent = user?.role === 'PARENT'

  const [parents, setParents] = useState([])
  const [students, setStudents] = useState([])
  const [ownerType, setOwnerType] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [isLoadingOwners, setIsLoadingOwners] = useState(true)
  const [ownersError, setOwnersError] = useState('')

  const loadOwners = useCallback(async () => {
    setIsLoadingOwners(true)
    setOwnersError('')

    const [parentsResult, studentsResult] = await Promise.allSettled([
      getParents(),
      getStudents(),
    ])

    if (parentsResult.status === 'fulfilled') {
      setParents(normalizeCollection(parentsResult.value))
    }

    if (studentsResult.status === 'fulfilled') {
      setStudents(normalizeCollection(studentsResult.value))
    }

    if (parentsResult.status === 'rejected' || studentsResult.status === 'rejected') {
      setOwnersError('Certains proprietaires sont indisponibles. Rechargez les listes avant d appliquer un filtre.')
    }

    setIsLoadingOwners(false)
  }, [])

  useEffect(() => {
    let isCancelled = false

    Promise.allSettled([
      getParents(),
      getStudents(),
    ]).then(([parentsResult, studentsResult]) => {
      if (isCancelled) {
        return
      }

      if (parentsResult.status === 'fulfilled') {
        setParents(normalizeCollection(parentsResult.value))
      }

      if (studentsResult.status === 'fulfilled') {
        setStudents(normalizeCollection(studentsResult.value))
      }

      if (parentsResult.status === 'rejected' || studentsResult.status === 'rejected') {
        setOwnersError('Certains proprietaires sont indisponibles. Rechargez les listes avant d appliquer un filtre.')
      }

      setIsLoadingOwners(false)
    })

    return () => {
      isCancelled = true
    }
  }, [])

  const loadAdresses = useCallback(() => {
    if (ownerType === 'parent' && ownerId) {
      return getParentAdresses(ownerId)
    }

    if (ownerType === 'student' && ownerId) {
      return getStudentAdresses(ownerId)
    }

    return getAdresses()
  }, [ownerId, ownerType])

  const ownerOptions = useMemo(
    () => getOwnerOptions(ownerType, parents, students),
    [ownerType, parents, students]
  )
  const columns = useMemo(() => getColumns(parents, students), [parents, students])

  const handleOwnerTypeChange = (event) => {
    setOwnerType(event.target.value)
    setOwnerId('')
  }

  const clearFilter = () => {
    setOwnerType('')
    setOwnerId('')
  }

  const [filters, setFilters] = useState({
    parent: false,
    eleve: false,
    actif: false,
    inactif: false,
  })

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const localFilter = (item) => {
    // parent / eleve
    if (filters.parent && !filters.eleve) {
      if (!item.parent_id) return false
    }
    if (filters.eleve && !filters.parent) {
      if (!item.student_id) return false
    }

    // actif / inactif
    if (filters.actif || filters.inactif) {
      const status = item.statut || item.parent?.statut || item.student?.statut || 'ACTIF'
      if (filters.actif && !filters.inactif && status !== 'ACTIF') return false
      if (filters.inactif && !filters.actif && status !== 'INACTIF') return false
    }

    return true
  }

  return (
    <EntityListPage
      isLoadingDependencies={isLoadingOwners}
      title='Adresses'
      description='Consultez et gerez les adresses rattachees aux parents et aux eleves.'
      loadItems={loadAdresses}
      columns={columns}
      emptyMessage='Aucune adresse enregistree.'
      createPath={null}
      createLabel={null}
      getRowPath={(item) => `/adresses/${item.id}`}
      searchPlaceholder='Rechercher une adresse'
      getSearchText={(item) => [
        item.id,
        getAdresseOwnerName(item, parents, students),
        getAdresseText(item),
      ].join(' ')}
      successMessage={location.state?.successMessage}
      localFilter={localFilter}
      renderFilterPanel={({ isOpen, onClose }) => !isParent && (
        <FilterPanel
          isOpen={isOpen}
          onClose={onClose}
          onApply={onClose}
          onClear={() => setFilters({ parent: false, eleve: false, actif: false, inactif: false })}
        >
          <div className='filter-field'>
            <label>Type de propriétaire</label>
            <label className='filter-checkbox'>
              <input type='checkbox' checked={filters.parent} onChange={(e) => handleFilterChange('parent', e.target.checked)} />
              <span>Parent</span>
            </label>
            <label className='filter-checkbox'>
              <input type='checkbox' checked={filters.eleve} onChange={(e) => handleFilterChange('eleve', e.target.checked)} />
              <span>Elève</span>
            </label>
          </div>
          <div className='filter-field'>
            <label>Statut</label>
            <label className='filter-checkbox'>
              <input type='checkbox' checked={filters.actif} onChange={(e) => handleFilterChange('actif', e.target.checked)} />
              <span>Actif</span>
            </label>
            <label className='filter-checkbox'>
              <input type='checkbox' checked={filters.inactif} onChange={(e) => handleFilterChange('inactif', e.target.checked)} />
              <span>Inactif</span>
            </label>
          </div>
        </FilterPanel>
      )}
    />
  )
}

export default AdressesPage
