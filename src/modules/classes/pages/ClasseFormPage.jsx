import Loader from '../../../components/ui/Loader'
import React, { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import {
  createClasse,
  getClasse,
  updateClasse,
} from '../../../services/classeService'
import ModuleState from '../../inscriptions/components/ModuleState'

const DEFAULT_FORM = {
  designation: '',
  capacite: '',
  responsable: '',
  statut: 'ACTIF',
}

const normalizeForm = (classe = {}) => ({
  designation: classe.designation || '',
  capacite: classe.capacite ?? '',
  responsable: classe.responsable || '',
  statut: classe.statut || 'ACTIF',
})

const ClasseFormPage = ({ mode }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = mode === 'edit'
  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(isEditing)
  const [loadError, setLoadError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      return undefined
    }

    let isCancelled = false

    getClasse(id)
      .then((payload) => {
        if (!isCancelled) {
          setForm(normalizeForm(payload.classe || payload.data || payload))
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setLoadError(error.message || 'Impossible de charger cette classe.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [id, isEditing])

  const handleChange = (event) => {
    const { id: fieldId, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [fieldId]: value }))

    if (errors[fieldId]) {
      setErrors((currentErrors) => ({ ...currentErrors, [fieldId]: '' }))
    }
  }

  const validate = () => {
    const nextErrors = {}
    const capacite = Number(form.capacite)

    if (!form.designation.trim()) {
      nextErrors.designation = 'La designation est obligatoire.'
    }

    if (form.capacite && (!Number.isInteger(capacite) || capacite <= 0)) {
      nextErrors.capacite = 'La capacite doit etre un nombre entier superieur a zero.'
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
      const payload = {
        designation: form.designation.trim(),
        capacite: form.capacite ? Number(form.capacite) : null,
        responsable: form.responsable.trim() || null,
        statut: form.statut,
      }
      const response = isEditing
        ? await updateClasse(id, payload)
        : await createClasse(payload)
      const classe = response.classe || response.data || response
      const classeId = classe.id || id

      navigate(`/classes/${classeId}`, {
        replace: true,
        state: {
          successMessage: isEditing
            ? 'Classe modifiee avec succes.'
            : 'Classe creee avec succes.',
        },
      })
    } catch (error) {
      setFeedback(error.message || 'Impossible d enregistrer cette classe.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to={isEditing ? `/classes/${id}` : '/classes'} className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux classes
          </Link>
          <p className='inscription-page-kicker'>Gestion des classes</p>
          <h1>{isEditing ? 'Modifier la classe' : 'Nouvelle classe'}</h1>
          <p className='inscription-page-description'>
            Renseignez les informations utiles pour identifier la classe.
          </p>
        </div>
      </header>

      {isLoading && <Loader message='Chargement de la classe...' />}

      {!isLoading && loadError && (
        <ModuleState
          type='error'
          title='Classe indisponible'
          message={loadError}
          actionLabel='Retour a la liste'
          onAction={() => navigate('/classes')}
        />
      )}

      {!isLoading && !loadError && (
        <form className='inscription-form-panel' onSubmit={handleSubmit}>
          {feedback && (
            <Feedback
              type='error'
              title='Echec de l enregistrement'
              message={feedback}
              onClose={() => setFeedback('')}
            />
          )}

          <div className='inscription-form-grid'>
            <Input
              id='designation'
              type='text'
              label='Designation'
              placeholder='Designation'
              value={form.designation}
              error={errors.designation}
              disabled={isSubmitting}
              onChange={handleChange}
            />
            <Input
              id='capacite'
              type='number'
              min='1'
              label='Capacite'
              placeholder='Capacite'
              value={form.capacite}
              error={errors.capacite}
              disabled={isSubmitting}
              onChange={handleChange}
            />
            <Input
              id='responsable'
              type='text'
              label='Responsable'
              placeholder='Responsable'
              value={form.responsable}
              disabled={isSubmitting}
              onChange={handleChange}
            />
            <div className='input-wrapper'>
              <label htmlFor='statut' className='input-label'>Statut</label>
              <select
                id='statut'
                value={form.statut}
                disabled={isSubmitting}
                onChange={handleChange}
                className='input-field'
                style={{ display: 'block', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '1rem' }}
              >
                <option value='ACTIF'>ACTIF</option>
                <option value='INACTIF'>INACTIF</option>
                <option value='ARCHIVE'>ARCHIVE</option>
              </select>
            </div>
          </div>

          <div className='inscription-form-actions'>
            <Button
              type='button'
              variant='ghost'
              label='Annuler'
              disabled={isSubmitting}
              onClick={() => navigate(isEditing ? `/classes/${id}` : '/classes')}
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
      )}
    </section>
  )
}

export default ClasseFormPage
