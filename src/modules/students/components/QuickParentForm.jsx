import React, { useState } from 'react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import SelectField from '../../inscriptions/components/SelectField'
import { createParent } from '../../../services/parentService'
import {
  GENDER_OPTIONS,
  getParentPayload,
  normalizeParentForm,
  unwrapParent,
  validateParentForm,
} from '../../parents/utils/parent'

const QuickParentForm = ({
  parentRole,
  onCancel,
  onCreated,
  createParentRequest = createParent,
}) => {
  const [form, setForm] = useState(normalizeParentForm())
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

  const handleCreate = async () => {
    setFeedback('')

    const nextErrors = validateParentForm(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await createParentRequest(getParentPayload(form))
      const parent = unwrapParent(payload)

      onCreated(parent)
    } catch (error) {
      setFeedback(error.message || 'Impossible de creer ce parent.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className='student-quick-parent'>
      <div>
        <h3>Creation rapide : {parentRole === 'pere_id' ? 'pere' : 'mere'}</h3>
        <p>Ajoutez le parent puis il sera automatiquement selectionne.</p>
      </div>

      {feedback && (
        <Feedback
          type='error'
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
          label='Telephone (optionnel)'
          placeholder='Telephone (optionnel)'
          value={form.phone}
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

      <div className='student-quick-parent__actions'>
        <Button
          type='button'
          variant='ghost'
          label='Annuler'
          disabled={isSubmitting}
          onClick={onCancel}
          className='inscription-action inscription-action--secondary'
        />
        <Button
          type='button'
          variant='super'
          label={isSubmitting ? 'Ajout...' : 'Ajouter le parent'}
          loading={isSubmitting}
          onClick={handleCreate}
          className='inscription-action inscription-action--primary'
        />
      </div>
    </section>
  )
}

export default QuickParentForm
