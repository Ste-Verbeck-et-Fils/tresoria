import React, { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import {
  createInscription,
  getAnneesScolaires,
  getStudents,
} from '../../../services/inscriptionService'
import { getClasses } from '../../../services/classeService'
import SelectField from '../components/SelectField'
import ModuleState from '../components/ModuleState'
import { getDesignation, getStudentName, normalizeCollection, unwrapEntity } from '../utils/data'

const DEFAULT_FORM = {
  student_id: '',
  class_id: '',
  annee_scolaire_id: '',
}

const CreateInscriptionPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadOptions = async () => {
    setIsLoadingOptions(true)
    setOptionsError('')

    try {
      const [studentsPayload, classesPayload, anneesPayload] = await Promise.all([
        getStudents(),
        getClasses(),
        getAnneesScolaires(),
      ])

      setStudents(normalizeCollection(studentsPayload))
      setClasses(normalizeCollection(classesPayload))
      setAnneesScolaires(normalizeCollection(anneesPayload))
    } catch (error) {
      setOptionsError(error.message || 'Impossible de charger les donnees necessaires au formulaire.')
    } finally {
      setIsLoadingOptions(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    Promise.all([
      getStudents(),
      getClasses(),
      getAnneesScolaires(),
    ])
      .then(([studentsPayload, classesPayload, anneesPayload]) => {
        if (!isCancelled) {
          setStudents(normalizeCollection(studentsPayload))
          setClasses(normalizeCollection(classesPayload))
          setAnneesScolaires(normalizeCollection(anneesPayload))
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setOptionsError(error.message || 'Impossible de charger les donnees necessaires au formulaire.')
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

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [id]: value }))

    if (errors[id]) {
      setErrors((currentErrors) => ({ ...currentErrors, [id]: '' }))
    }
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
          <p className='inscription-page-description'>Associez un eleve, une classe et une annee scolaire.</p>
        </div>
      </header>

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
        <form className='inscription-form-panel' onSubmit={handleSubmit}>
          {feedback && (
            <Feedback
              type='error'
              title='Echec de l inscription'
              message={feedback}
              onClose={() => setFeedback('')}
            />
          )}

          <div className='inscription-form-grid'>
            <SelectField
              id='student_id'
              label='Eleve'
              value={form.student_id}
              options={students.map((student) => ({
                value: student.id,
                label: getStudentName(student),
              }))}
              placeholder='Selectionner un eleve'
              error={errors.student_id}
              disabled={isFormDisabled}
              onChange={handleChange}
            />

            <SelectField
              id='class_id'
              label='Classe'
              value={form.class_id}
              options={classes.map((classe) => ({
                value: classe.id,
                label: getDesignation(classe, `Classe #${classe.id}`),
              }))}
              placeholder='Selectionner une classe'
              error={errors.class_id}
              disabled={isFormDisabled}
              onChange={handleChange}
            />

            <SelectField
              id='annee_scolaire_id'
              label='Annee scolaire'
              value={form.annee_scolaire_id}
              options={anneesScolaires.map((annee) => ({
                value: annee.id,
                label: getDesignation(annee, `Annee #${annee.id}`),
              }))}
              placeholder='Selectionner une annee scolaire'
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
