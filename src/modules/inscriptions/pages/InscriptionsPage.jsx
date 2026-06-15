import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import FilterPanel from '../../../components/ui/FilterPanel'
import Input from '../../../components/ui/Input'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { getClasses } from '../../../services/classeService'
import {
  getAnneeScolaireInscriptions,
  getClasseInscriptions,
  getInscriptions,
  getStudentInscriptions,
} from '../../../services/inscriptionService'
import { getStudents } from '../../../services/studentService'
import EntityListPage from '../components/EntityListPage'
import SelectField from '../components/SelectField'
import StatusBadge from '../components/StatusBadge'
import {
  getDesignation,
  getInscriptionAnnee,
  getInscriptionClasse,
  getInscriptionParent,
  getInscriptionStudent,
  getParentName,
  getStudentName,
  normalizeCollection,
} from '../utils/data'
import {

  getInscriptionFilterLabel,
  getInscriptionFilterOptions,
  INSCRIPTION_FILTER_OPTIONS,
} from '../utils/inscription'

const hardcodedClasses = ['1M', '2M', '3M', '1P', '2P', '3P', '4P', '5P', '6P', '1S', '2S', '3S', '4S', '5S', '6S']

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

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Eleve', render: (item) => getStudentName(getInscriptionStudent(item)) },
  { label: 'Parent responsable', render: (item) => getParentName(getInscriptionParent(item)) },
  { label: 'Classe', render: (item) => getDesignation(getInscriptionClasse(item), `Classe #${item.class_id || '-'}`) },
  { label: 'Annee scolaire', render: (item) => getDesignation(getInscriptionAnnee(item), `Annee #${item.annee_scolaire_id || '-'}`) },
  { label: 'Statut', render: (item) => <StatusBadge value={item.statut} /> },
]

const InscriptionsPage = () => {
  const location = useLocation()
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [filters, setFilters] = useState({
    status: [],
    dateMin: '',
    dateMax: '',
    anneeScolaireId: '',
    classes: [],
  })
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')

  const applyOptionsResults = useCallback((studentsResult, classesResult, anneesResult) => {
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

    const [studentsResult, classesResult, anneesResult] = await Promise.allSettled([
      getStudents(),
      getClasses(),
      getAnneesScolaires(),
    ])

    applyOptionsResults(studentsResult, classesResult, anneesResult)
    setIsLoadingOptions(false)
  }, [applyOptionsResults])

  useEffect(() => {
    let isCancelled = false

    Promise.allSettled([
      getStudents(),
      getClasses(),
      getAnneesScolaires(),
    ]).then(([studentsResult, classesResult, anneesResult]) => {
      if (!isCancelled) {
        applyOptionsResults(studentsResult, classesResult, anneesResult)
        setIsLoadingOptions(false)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [applyOptionsResults])

  const loadInscriptions = useCallback(() => {
    return getInscriptions()
  }, [])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleArrayToggle = (key, value) => {
    setFilters((prev) => {
      const arr = prev[key]
      const isSelected = arr.includes(value)
      return {
        ...prev,
        [key]: isSelected ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
  }

  const localFilter = (item) => {
    if (filters.status.length > 0 && !filters.status.includes(item.statut)) return false

    if (filters.dateMin || filters.dateMax) {
      const date = item.created_at
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

    if (filters.anneeScolaireId) {
      const annee = getInscriptionAnnee(item)
      if (!annee || annee.id.toString() !== filters.anneeScolaireId.toString()) return false
    }

    if (filters.classes.length > 0) {
      const classe = getInscriptionClasse(item)
      if (!classe) return false
      const abbr = abbreviateClass(getDesignation(classe))
      if (!filters.classes.includes(abbr)) return false
    }

    return true
  }

  const hasActiveFilters = filters.status.length > 0 ||
    filters.dateMin !== '' ||
    filters.dateMax !== '' ||
    filters.anneeScolaireId !== '' ||
    filters.classes.length > 0

  const handleClearFilters = () => {
    setFilters({
      status: [], dateMin: '', dateMax: '', anneeScolaireId: '', classes: []
    })
  }

  return (
    <EntityListPage
      isLoadingDependencies={isLoadingOptions}
      title='Inscriptions'
      description='Consultez, filtrez et administrez les inscriptions enregistrees.'
      loadItems={loadInscriptions}
      columns={columns}
      emptyMessage='Aucune inscription enregistree.'
      createPath='/inscriptions/create'
      createLabel='Nouvelle inscription'
      getRowPath={(item) => `/inscriptions/${item.id}`}
      searchPlaceholder='Rechercher une inscription'
      getSearchText={(item) => [
        item.id,
        getStudentName(getInscriptionStudent(item)),
        getParentName(getInscriptionParent(item)),
        getDesignation(getInscriptionClasse(item)),
        getDesignation(getInscriptionAnnee(item)),
        item.statut,
      ].join(' ')}
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
            <label>Statut</label>
            <select
              className='inscription-select'
              value={filters.status[0] || ''}
              onChange={(e) => {
                const val = e.target.value
                setFilters((prev) => ({ ...prev, status: val ? [val] : [] }))
              }}
            >
              <option value=''>Tous les statuts</option>
              <option value='ACTIF'>ACTIF</option>
              <option value='CLOTURE'>CLOTURE</option>
              <option value='ABANDON'>ABANDON</option>
            </select>
          </div>

          <div className='filter-field'>
            <label>Période d'inscription</label>
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
            <label>Année scolaire</label>
            <select
              className='inscription-select'
              value={filters.anneeScolaireId}
              onChange={(e) => handleFilterChange('anneeScolaireId', e.target.value)}
            >
              <option value=''>Toutes les années</option>
              {anneesScolaires.map((a) => (
                <option key={a.id} value={a.id}>{getDesignation(a)}</option>
              ))}
            </select>
          </div>

          <div className='filter-field'>
            <label>Classes</label>
            <div className='filter-field-row' style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
              {hardcodedClasses.map((c) => (
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

export default InscriptionsPage
