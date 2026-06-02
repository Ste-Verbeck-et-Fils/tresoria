import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import EntityListPage from '../../inscriptions/components/EntityListPage'
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
  { label: 'Commune', render: (item) => item.commune || 'Non renseigne' },
  { label: 'Quartier', render: (item) => item.quartier || 'Non renseigne' },
  { label: 'Avenue', render: (item) => item.avenue || 'Non renseigne' },
  { label: 'Numero', render: (item) => item.numero || 'Non renseigne' },
]

const AdressesPage = () => {
  const location = useLocation()
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

  const filterPanel = (
    <section className='module-filter-panel'>
      <div>
        <h2>Filtrer par proprietaire</h2>
        <p>Affichez toutes les adresses ou limitez la liste a un parent ou a un eleve.</p>
      </div>

      <div className='module-filter-panel__fields'>
        <SelectField
          id='adresse-owner-type-filter'
          label='Type de proprietaire'
          value={ownerType}
          options={OWNER_TYPE_OPTIONS}
          placeholder='Tous les proprietaires'
          disabled={isLoadingOwners}
          onChange={handleOwnerTypeChange}
        />
        {ownerType && (
          <SelectField
            id='adresse-owner-filter'
            label={ownerType === 'parent' ? 'Parent' : 'Eleve'}
            value={ownerId}
            options={ownerOptions}
            placeholder={ownerType === 'parent' ? 'Selectionner un parent' : 'Selectionner un eleve'}
            disabled={isLoadingOwners}
            onChange={(event) => setOwnerId(event.target.value)}
          />
        )}
        {(ownerType || ownerId) && (
          <Button
            type='button'
            variant='ghost'
            label='Effacer le filtre'
            onClick={clearFilter}
            className='inscription-action inscription-action--secondary module-filter-panel__clear'
          />
        )}
      </div>

      {isLoadingOwners && <p className='module-filter-panel__state'>Chargement des proprietaires...</p>}
      {!isLoadingOwners && ownersError && (
        <div className='module-filter-panel__warning'>
          <Feedback type='warning' message={ownersError} />
          <Button
            type='button'
            variant='ghost'
            label='Reessayer'
            onClick={loadOwners}
            className='inscription-action inscription-action--secondary'
          />
        </div>
      )}
    </section>
  )

  return (
    <EntityListPage
      title='Adresses'
      description='Consultez et gerez les adresses rattachees aux parents et aux eleves.'
      loadItems={loadAdresses}
      columns={columns}
      emptyMessage='Aucune adresse enregistree.'
      createPath='/adresses/create'
      createLabel='Nouvelle adresse'
      getRowPath={(item) => `/adresses/${item.id}`}
      searchPlaceholder='Rechercher une adresse'
      getSearchText={(item) => [
        item.id,
        getAdresseOwnerName(item, parents, students),
        getAdresseText(item),
      ].join(' ')}
      successMessage={location.state?.successMessage}
      beforePanel={filterPanel}
    />
  )
}

export default AdressesPage
