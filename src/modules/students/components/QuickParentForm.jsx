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

const QuickParentForm = ({ parentRole, initialSearch, onCancel, onCreated }) => {
  const expectedGender = parentRole === 'pere_id' ? 'MASCULIN' : 'FEMININ'
  const [form, setForm] = useState(() => {
    const defaultForm = normalizeParentForm()
    if (initialSearch) {
      if (/^[\d\s\+\-\(\)]+$/.test(initialSearch.trim())) {
        defaultForm.phone = initialSearch.trim()
      } else {
        defaultForm.full_name = initialSearch.trim()
      }
    }
    return {
      ...defaultForm,
      gender: expectedGender,
    }
  })
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
      const payload = await createParent(getParentPayload(form))
      const parent = unwrapParent(payload)

      if (!parent?.id) {
        throw new Error('La reponse du serveur ne contient pas le parent cree.')
      }

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
        <div className={`inscription-radio-group ${errors.gender ? 'has-error' : ''}`}>
          <label className='inscription-field-label' style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Genre</label>
          <div className='inscription-radio-options' style={{ display: 'flex', gap: '15px' }}>
            {GENDER_OPTIONS.map((opt) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                <input type='radio' id='gender' name='gender' value={opt.value} checked={form.gender === opt.value} onChange={handleChange} disabled />
                {opt.label}
              </label>
            ))}
          </div>
          {errors.gender && <span className='inscription-field-error'>{errors.gender}</span>}
        </div>
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
