import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
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
  const [filterType, setFilterType] = useState('')
  const [filterId, setFilterId] = useState('')
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
    if (filterType === 'student' && filterId) {
      return getStudentInscriptions(filterId)
    }

    if (filterType === 'classe' && filterId) {
      return getClasseInscriptions(filterId)
    }

    if (filterType === 'annee_scolaire' && filterId) {
      return getAnneeScolaireInscriptions(filterId)
    }

    return getInscriptions()
  }, [filterId, filterType])

  const filterOptions = useMemo(
    () => getInscriptionFilterOptions(filterType, students, classes, anneesScolaires),
    [filterType, students, classes, anneesScolaires]
  )

  const handleFilterTypeChange = (event) => {
    setFilterType(event.target.value)
    setFilterId('')
  }

  const clearFilter = () => {
    setFilterType('')
    setFilterId('')
  }

  const filterPanel = (
    <section className='module-filter-panel'>
      <div>
        <h2>Filtrer les inscriptions</h2>
        <p>Affichez toutes les inscriptions ou limitez la liste a un eleve, une classe ou une annee scolaire.</p>
      </div>

      <div className='module-filter-panel__fields'>
        <SelectField
          id='inscription-filter-type'
          label='Type de filtre'
          value={filterType}
          options={INSCRIPTION_FILTER_OPTIONS}
          placeholder='Toutes les inscriptions'
          disabled={isLoadingOptions}
          onChange={handleFilterTypeChange}
        />
        {filterType && (
          <SelectField
            id='inscription-filter-value'
            label={getInscriptionFilterLabel(filterType)}
            value={filterId}
            options={filterOptions}
            placeholder={`Selectionner : ${getInscriptionFilterLabel(filterType).toLowerCase()}`}
            disabled={isLoadingOptions}
            onChange={(event) => setFilterId(event.target.value)}
          />
        )}
        {(filterType || filterId) && (
          <Button
            type='button'
            variant='ghost'
            label='Effacer le filtre'
            onClick={clearFilter}
            className='inscription-action inscription-action--secondary module-filter-panel__clear'
          />
        )}
      </div>

      {isLoadingOptions && <Loader message='Chargement des filtres...' />}
      {!isLoadingOptions && optionsError && (
        <div className='module-filter-panel__warning'>
          <Feedback type='warning' message={optionsError} />
          <Button
            type='button'
            variant='ghost'
            label='Reessayer'
            onClick={loadOptions}
            className='inscription-action inscription-action--secondary'
          />
        </div>
      )}
    </section>
  )

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
      beforePanel={filterPanel}
    />
  )
}

export default InscriptionsPage
