import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import SelectField from '../../inscriptions/components/SelectField'
import { createAdresse, createParent } from '../../../services/parentService'
import {
  GENDER_OPTIONS,
  getAdressePayload,
  getParentPayload,
  normalizeAdresseForm,
  normalizeParentForm,
  unwrapParent,
  validateAdresseForm,
  validateParentForm,
} from '../utils/parent'

const CreateParentPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = location.state?.returnTo
  const returnState = returnTo
    ? { inscriptionDraft: location.state?.inscriptionDraft }
    : undefined
  const [form, setForm] = useState(normalizeParentForm())
  const [adresseForm, setAdresseForm] = useState(normalizeAdresseForm())
  const [withAdresse, setWithAdresse] = useState(false)
  const [errors, setErrors] = useState({})
  const [adresseErrors, setAdresseErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [id]: value }))

    if (errors[id]) {
      setErrors((currentErrors) => ({ ...currentErrors, [id]: '' }))
    }
  }

  const handleAdresseChange = (event) => {
    const { id, value } = event.target
    setAdresseForm((currentForm) => ({ ...currentForm, [id]: value }))

    if (adresseErrors[id]) {
      setAdresseErrors((currentErrors) => ({ ...currentErrors, [id]: '' }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')

    const nextErrors = validateParentForm(form)
    const nextAdresseErrors = withAdresse ? validateAdresseForm(adresseForm) : {}

    setErrors(nextErrors)
    setAdresseErrors(nextAdresseErrors)

    if (Object.keys(nextErrors).length > 0 || Object.keys(nextAdresseErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await createParent(getParentPayload(form))
      const parent = unwrapParent(response)

      if (withAdresse && parent?.id) {
        try {
          await createAdresse(getAdressePayload(adresseForm, parent.id))
        } catch (adresseError) {
          if (returnTo) {
            navigate(returnTo, {
              replace: true,
              state: {
                ...returnState,
                createdParent: parent,
                warningMessage: adresseError.message || 'Le parent a ete cree, mais son adresse n a pas pu etre ajoutee.',
              },
            })
            return
          }

          navigate(`/parents/${parent.id}`, {
            replace: true,
            state: {
              warningMessage: adresseError.message || 'Le parent a ete cree, mais son adresse n a pas pu etre ajoutee.',
            },
          })
          return
        }
      }

      if (returnTo && parent?.id) {
        navigate(returnTo, {
          replace: true,
          state: {
            ...returnState,
            createdParent: parent,
            successMessage: 'Parent cree et selectionne avec succes.',
          },
        })
        return
      }

      navigate(parent?.id ? `/parents/${parent.id}` : '/parents', {
        replace: true,
        state: { successMessage: 'Parent cree avec succes.' },
      })
    } catch (error) {
      setFeedback(error.message || 'Impossible de creer ce parent.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to={returnTo || '/parents'} state={returnState} className='inscription-back-link'>
            <ArrowLeft size={16} />
            {returnTo ? 'Retour a l inscription' : 'Retour aux parents'}
          </Link>
          <h1>Nouveau parent</h1>

        </div>
      </header>

      <form className='inscription-form-panel parent-create-form' onSubmit={handleSubmit}>
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
            id='full_name'
            type='text'
            label='Nom complet'
            placeholder='Nom complet'
            value={form.full_name}
            error={errors.full_name}
            disabled={isSubmitting}
            onChange={handleChange}
          />
          <Input
            id='phone'
            type='tel'
            label='Telephone'
            placeholder='Telephone'
            value={form.phone}
            error={errors.phone}
            disabled={isSubmitting}
            onChange={handleChange}
          />
          <SelectField
            id='gender'
            label='Genre'
            value={form.gender}
            options={GENDER_OPTIONS}
            placeholder='Selectionner un genre'
            error={errors.gender}
            disabled={isSubmitting}
            onChange={handleChange}
            className='parent-create-gender-field'
          />
          <Input
            id='profession'
            type='text'
            label='Profession'
            placeholder='Profession'
            value={form.profession}
            error={errors.profession}
            disabled={isSubmitting}
            onChange={handleChange}
          />
        </div>

        <label className='parent-address-toggle'>
          <input
            type='checkbox'
            checked={withAdresse}
            disabled={isSubmitting}
            onChange={(event) => setWithAdresse(event.target.checked)}
          />
          Ajouter une adresse maintenant
        </label>

        {withAdresse && (
          <div className='parent-address-create-panel'>
            <h2>Adresse du parent</h2>
            <div className='inscription-form-grid'>
              <Input
                id='commune'
                type='text'
                label='Commune'
                placeholder='Commune'
                value={adresseForm.commune}
                error={adresseErrors.commune}
                disabled={isSubmitting}
                onChange={handleAdresseChange}
              />
              <Input
                id='quartier'
                type='text'
                label='Quartier'
                placeholder='Quartier'
                value={adresseForm.quartier}
                error={adresseErrors.quartier}
                disabled={isSubmitting}
                onChange={handleAdresseChange}
              />
              <Input
                id='avenue'
                type='text'
                label='Avenue'
                placeholder='Avenue'
                value={adresseForm.avenue}
                error={adresseErrors.avenue}
                disabled={isSubmitting}
                onChange={handleAdresseChange}
              />
              <Input
                id='numero'
                type='text'
                label='Numero'
                placeholder='Numero'
                value={adresseForm.numero}
                disabled={isSubmitting}
                onChange={handleAdresseChange}
              />
            </div>
          </div>
        )}

        <div className='inscription-form-actions'>
          <Button
            type='button'
            variant='ghost'
            label='Annuler'
            disabled={isSubmitting}
            onClick={() => navigate(returnTo || '/parents', { state: returnState })}
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

export default CreateParentPage
