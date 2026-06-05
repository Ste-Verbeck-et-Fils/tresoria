import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import SelectField from '../../inscriptions/components/SelectField'
import { normalizeCollection } from '../../inscriptions/utils/data'
import {
  getOwnedAdressePayload,
  normalizeOwnedAdresseForm,
  unwrapAdresse,
  validateOwnedAdresseForm,
} from '../../inscriptions/utils/adresse'
import { createAdresse } from '../../../services/adresseService'
import { getParents } from '../../../services/parentService'
import { getStudents } from '../../../services/studentService'
import { getOwnerOptions, OWNER_TYPE_OPTIONS } from '../utils/adresse'

const CreateAdressePage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(normalizeOwnedAdresseForm())
  const [ownerType, setOwnerType] = useState('')
  const [parents, setParents] = useState([])
  const [students, setStudents] = useState([])
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [ownersError, setOwnersError] = useState('')
  const [isLoadingOwners, setIsLoadingOwners] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      setOwnersError('Impossible de charger certains proprietaires. Reessayez avant de creer l adresse.')
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
        setOwnersError('Impossible de charger certains proprietaires. Reessayez avant de creer l adresse.')
      }

      setIsLoadingOwners(false)
    })

    return () => {
      isCancelled = true
    }
  }, [])

  const ownerOptions = useMemo(
    () => getOwnerOptions(ownerType, parents, students),
    [ownerType, parents, students]
  )

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((currentErrors) => ({ ...currentErrors, [field]: '' }))
    }
  }

  const handleOwnerTypeChange = (event) => {
    setOwnerType(event.target.value)
    setForm((currentForm) => ({ ...currentForm, parent_id: '', student_id: '' }))
    clearError('owner_id')
  }

  const handleOwnerChange = (event) => {
    const ownerKey = ownerType === 'parent' ? 'parent_id' : 'student_id'
    const otherOwnerKey = ownerType === 'parent' ? 'student_id' : 'parent_id'

    setForm((currentForm) => ({
      ...currentForm,
      [ownerKey]: event.target.value,
      [otherOwnerKey]: '',
    }))
    clearError('owner_id')
  }

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [id]: value }))
    clearError(id)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')

    const nextErrors = validateOwnedAdresseForm(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await createAdresse(getOwnedAdressePayload(form))
      const adresse = unwrapAdresse(payload)

      navigate(adresse?.id ? `/adresses/${adresse.id}` : '/adresses', {
        replace: true,
        state: { successMessage: 'Adresse creee avec succes.' },
      })
    } catch (error) {
      setFeedback(error.message || 'Impossible de creer cette adresse.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/adresses' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux adresses
          </Link>
          <h1>Nouvelle adresse</h1>
          
        </div>
      </header>

      <form className='inscription-form-panel adresse-create-form' onSubmit={handleSubmit}>
        {feedback && (
          <Feedback
            type='error'
            title='Echec de l enregistrement'
            message={feedback}
            onClose={() => setFeedback('')}
          />
        )}

        {isLoadingOwners && <Loader message='Chargement des proprietaires...' />}
        {!isLoadingOwners && ownersError && (
          <div className='adresse-owner-warning'>
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

        <section className='student-form-section'>
          <h2>Proprietaire</h2>
          <div className='inscription-form-grid'>
            <SelectField
              id='owner_type'
              label='Type de proprietaire'
              value={ownerType}
              options={OWNER_TYPE_OPTIONS}
              placeholder='Selectionner un type'
              error={!ownerType ? errors.owner_id : ''}
              disabled={isSubmitting || isLoadingOwners}
              onChange={handleOwnerTypeChange}
            />
            {ownerType && (
              <SelectField
                id='owner_id'
                label={ownerType === 'parent' ? 'Parent' : 'Eleve'}
                value={ownerType === 'parent' ? form.parent_id : form.student_id}
                options={ownerOptions}
                placeholder={ownerType === 'parent' ? 'Selectionner un parent' : 'Selectionner un eleve'}
                error={errors.owner_id}
                disabled={isSubmitting || isLoadingOwners}
                onChange={handleOwnerChange}
              />
            )}
          </div>
        </section>

        <section className='student-form-section'>
          <h2>Localisation</h2>
          <div className='inscription-form-grid'>
            <Input id='commune' type='text' label='Commune' placeholder='Commune' value={form.commune} disabled={isSubmitting} onChange={handleChange} />
            <Input id='quartier' type='text' label='Quartier' placeholder='Quartier' value={form.quartier} error={errors.quartier} disabled={isSubmitting} onChange={handleChange} />
            <Input id='avenue' type='text' label='Avenue' placeholder='Avenue' value={form.avenue} disabled={isSubmitting} onChange={handleChange} />
            <Input id='numero' type='text' label='Numero' placeholder='Numero' value={form.numero} disabled={isSubmitting} onChange={handleChange} />
          </div>
        </section>

        <div className='inscription-form-actions'>
          <Button
            type='button'
            variant='ghost'
            label='Annuler'
            disabled={isSubmitting}
            onClick={() => navigate('/adresses')}
            className='inscription-action inscription-action--secondary'
          />
          <Button
            type='submit'
            variant='super'
            label={isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            loading={isSubmitting}
            className='inscription-action inscription-action--primary'
          />
        </div>
      </form>
    </section>
  )
}

export default CreateAdressePage
