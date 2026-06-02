import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { getClasses } from '../../../services/classeService'
import { createInscription } from '../../../services/inscriptionService'
import { getParents } from '../../../services/parentService'
import { getStudents } from '../../../services/studentService'
import ModuleState from '../components/ModuleState'
import SearchableSelectField from '../components/SearchableSelectField'
import {
  getDesignation,
  getParentName,
  getStudentName,
  normalizeCollection,
  unwrapEntity,
} from '../utils/data'

const DEFAULT_FORM = {
  student_id: '',
  parent_id: '',
  class_id: '',
  annee_scolaire_id: '',
}

const getInitialForm = (navigationState = {}) => {
  const safeNavigationState = navigationState || {}
  const form = {
    ...DEFAULT_FORM,
    ...safeNavigationState.inscriptionDraft,
  }

  if (safeNavigationState.createdStudent?.id) {
    form.student_id = String(safeNavigationState.createdStudent.id)
  }

  if (safeNavigationState.createdParent?.id) {
    form.parent_id = String(safeNavigationState.createdParent.id)
  }

  return form
}

const includeCreatedEntity = (items, createdEntity) => {
  if (!createdEntity?.id) {
    return items
  }

  return [
    ...items.filter((item) => Number(item.id) !== Number(createdEntity.id)),
    createdEntity,
  ]
}

const CreateInscriptionPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => getInitialForm(location.state))
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [students, setStudents] = useState([])
  const [parents, setParents] = useState([])
  const [classes, setClasses] = useState([])
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [parentsError, setParentsError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const applyOptionsResults = useCallback((studentsResult, parentsResult, classesResult, anneesResult) => {
    if (studentsResult.status === 'fulfilled') {
      setStudents(normalizeCollection(studentsResult.value))
    }

    if (parentsResult.status === 'fulfilled') {
      setParents(normalizeCollection(parentsResult.value))
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
      setOptionsError('Impossible de charger les eleves, les classes ou les annees scolaires.')
    }

    if (parentsResult.status === 'rejected') {
      setParentsError('Les parents responsables sont momentanement indisponibles.')
    }
  }, [])

  const loadOptions = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError('')
    setParentsError('')

    const results = await Promise.allSettled([
      getStudents(),
      getParents(),
      getClasses(),
      getAnneesScolaires(),
    ])

    applyOptionsResults(...results)
    setIsLoadingOptions(false)
  }, [applyOptionsResults])

  useEffect(() => {
    let isCancelled = false

    Promise.allSettled([
      getStudents(),
      getParents(),
      getClasses(),
      getAnneesScolaires(),
    ]).then((results) => {
      if (!isCancelled) {
        applyOptionsResults(...results)
        setIsLoadingOptions(false)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [applyOptionsResults])

  const studentOptions = useMemo(
    () => includeCreatedEntity(students, location.state?.createdStudent).map((student) => ({
      value: student.id,
      label: getStudentName(student),
      searchText: student.contact || '',
    })),
    [location.state?.createdStudent, students]
  )
  const parentOptions = useMemo(
    () => includeCreatedEntity(parents, location.state?.createdParent).map((parent) => ({
      value: parent.id,
      label: `${getParentName(parent)}${parent.phone ? ` - ${parent.phone}` : ''}`,
      searchText: parent.phone || '',
    })),
    [location.state?.createdParent, parents]
  )
  const classeOptions = useMemo(
    () => classes.map((classe) => ({
      value: classe.id,
      label: getDesignation(classe, `Classe #${classe.id}`),
      searchText: classe.responsable || '',
    })),
    [classes]
  )
  const anneeOptions = useMemo(
    () => anneesScolaires.map((annee) => ({
      value: annee.id,
      label: getDesignation(annee, `Annee #${annee.id}`),
      searchText: annee.statut || '',
    })),
    [anneesScolaires]
  )

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [id]: value }))

    if (errors[id]) {
      setErrors((currentErrors) => ({ ...currentErrors, [id]: '' }))
    }
  }

  const openCreationPage = (path) => {
    navigate(path, {
      state: {
        returnTo: '/inscriptions/create',
        inscriptionDraft: form,
      },
    })
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.student_id) {
      nextErrors.student_id = 'Selectionnez un eleve.'
    }

    if (!form.class_id) {
      nextErrors.class_id = 'Selectionnez une classe.'
    }

    if (!form.annee_scolaire_id) {
      nextErrors.annee_scolaire_id = 'Selectionnez une annee scolaire.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await createInscription({
        student_id: Number(form.student_id),
        ...(form.parent_id ? { parent_id: Number(form.parent_id) } : {}),
        class_id: Number(form.class_id),
        annee_scolaire_id: Number(form.annee_scolaire_id),
      })
      const inscription = unwrapEntity(payload, 'inscription')

      navigate(inscription.id ? `/inscriptions/${inscription.id}` : '/inscriptions', {
        replace: true,
        state: { successMessage: 'Inscription creee avec succes.' },
      })
    } catch (error) {
      setFeedback(error.message || 'Impossible de creer l inscription.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormDisabled = isLoadingOptions || Boolean(optionsError) || isSubmitting

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/inscriptions' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux inscriptions
          </Link>
          <p className='inscription-page-kicker'>Module inscription</p>
          <h1>Nouvelle inscription</h1>
          <p className='inscription-page-description'>
            Recherchez les informations necessaires puis inscrivez un eleve existant dans une classe.
          </p>
        </div>
      </header>

      {location.state?.successMessage && <Feedback type='success' message={location.state.successMessage} />}
      {location.state?.warningMessage && <Feedback type='warning' message={location.state.warningMessage} />}

      {isLoadingOptions && (
        <div className='inscription-loading' role='status'>Chargement du formulaire...</div>
      )}

      {!isLoadingOptions && optionsError && (
        <ModuleState
          type='error'
          title='Formulaire indisponible'
          message={optionsError}
          actionLabel='Reessayer'
          onAction={loadOptions}
        />
      )}

      {!isLoadingOptions && !optionsError && (
        <form className='inscription-form-panel inscription-create-form' onSubmit={handleSubmit}>
          {feedback && (
            <Feedback
              type='error'
              title='Echec de l inscription'
              message={feedback}
              onClose={() => setFeedback('')}
            />
          )}

          {parentsError && (
            <Feedback
              type='warning'
              message={`${parentsError} Vous pouvez poursuivre sans parent ou recharger la page.`}
            />
          )}

          <div className='inscription-form-grid'>
            <SearchableSelectField
              id='student_id'
              label='Eleve'
              value={form.student_id}
              options={studentOptions}
              placeholder='Rechercher un eleve'
              emptyMessage='Aucun eleve ne correspond a votre recherche.'
              createLabel='Creer un nouvel eleve'
              error={errors.student_id}
              disabled={isFormDisabled}
              onChange={handleChange}
              onCreate={() => openCreationPage('/students/create')}
            />

            <SearchableSelectField
              id='parent_id'
              label='Parent responsable (optionnel)'
              value={form.parent_id}
              options={parentOptions}
              placeholder='Rechercher un parent'
              emptyMessage='Aucun parent ne correspond a votre recherche.'
              createLabel='Creer un nouveau parent'
              disabled={isSubmitting}
              onChange={handleChange}
              onCreate={() => openCreationPage('/parents/create')}
            />

            <SearchableSelectField
              id='class_id'
              label='Classe'
              value={form.class_id}
              options={classeOptions}
              placeholder='Rechercher une classe'
              emptyMessage='Aucune classe ne correspond a votre recherche.'
              error={errors.class_id}
              disabled={isFormDisabled}
              onChange={handleChange}
            />

            <SearchableSelectField
              id='annee_scolaire_id'
              label='Annee scolaire'
              value={form.annee_scolaire_id}
              options={anneeOptions}
              placeholder='Rechercher une annee scolaire'
              emptyMessage='Aucune annee scolaire ne correspond a votre recherche.'
              error={errors.annee_scolaire_id}
              disabled={isFormDisabled}
              onChange={handleChange}
            />
          </div>

          <div className='inscription-form-actions'>
            <Button
              type='button'
              variant='ghost'
              label='Annuler'
              onClick={() => navigate('/inscriptions')}
              disabled={isSubmitting}
              className='inscription-action inscription-action--secondary'
            />
            <Button
              type='submit'
              variant='super'
              label={isSubmitting ? 'Enregistrement...' : 'Enregistrer l inscription'}
              loading={isSubmitting}
              disabled={isFormDisabled}
              className='inscription-action inscription-action--primary'
            />
          </div>
        </form>
      )}
    </section>
  )
}

export default CreateInscriptionPage
