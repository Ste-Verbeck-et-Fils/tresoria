import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import { createAnneeScolaire } from '../../../services/anneeScolaireService'
import {
  getAnneeScolairePayload,
  normalizeAnneeScolaireForm,
  unwrapAnneeScolaire,
  validateAnneeScolaireForm,
} from '../utils/anneeScolaire'

const CreateAnneeScolairePage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(normalizeAnneeScolaireForm())
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [id]: value }))

    if (errors[id]) {
      setErrors((currentErrors) => ({ ...currentErrors, [id]: '' }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')

    const nextErrors = validateAnneeScolaireForm(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await createAnneeScolaire(getAnneeScolairePayload(form))
      const anneeScolaire = unwrapAnneeScolaire(response)

      navigate(anneeScolaire?.id ? `/annees-scolaires/${anneeScolaire.id}` : '/annees-scolaires', {
        replace: true,
        state: { successMessage: 'Annee scolaire creee avec succes.' },
      })
    } catch (error) {
      setFeedback(error.message || 'Impossible de creer cette annee scolaire.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/annees-scolaires' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux annees scolaires
          </Link>

          <h1>Nouvelle annee scolaire</h1>
          
        </div>
      </header>

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
            placeholder='Exemple : 2026-2027'
            value={form.designation}
            error={errors.designation}
            disabled={isSubmitting}
            onChange={handleChange}
          />
          <Input
            id='frais'
            type='number'
            min='0'
            step='0.01'
            label='Frais'
            placeholder='Frais'
            value={form.frais}
            error={errors.frais}
            disabled={isSubmitting}
            onChange={handleChange}
          />
          <Input
            id='budget'
            type='number'
            min='0'
            step='0.01'
            label='Budget'
            placeholder='Budget'
            value={form.budget}
            error={errors.budget}
            disabled={isSubmitting}
            onChange={handleChange}
          />
        </div>

        <div className='inscription-form-actions'>
          <Button
            type='button'
            variant='ghost'
            label='Annuler'
            disabled={isSubmitting}
            onClick={() => navigate('/annees-scolaires')}
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

export default CreateAnneeScolairePage
