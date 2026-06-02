import { useState } from 'react'
import Button from '../../../components/ui/Button.jsx'
import Feedback from '../../../components/ui/Feedback.jsx'
import Input from '../../../components/ui/Input.jsx'
import { createParent, searchParentsByPhone } from '../../../services/parentService.js'
import { unwrapParent } from '../../parents/utils/parent.js'
import { getParentName, normalizeCollection } from '../utils/data.js'
import FlowAdresseFields from './FlowAdresseFields.jsx'
import {
  createEmptyFlowParent,
  getCreateFlowParentPayload,
  hasValidationErrors,
  validateFlowParent,
} from '../utils/fullFlow.js'

const ROLE_CONFIG = {
  pere: {
    title: 'Pere',
    description: 'Recherchez le pere par telephone ou creez-le directement.',
    gender: 'MASCULIN',
  },
  mere: {
    title: 'Mere',
    description: 'Recherchez la mere par telephone ou creez-la directement.',
    gender: 'FEMININ',
  },
}

const FullFlowParentCard = ({ role, selectedParent, onSelect }) => {
  const config = ROLE_CONFIG[role]
  const [phone, setPhone] = useState('')
  const [results, setResults] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(() => createEmptyFlowParent(config.gender))
  const [errors, setErrors] = useState({})

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const updateAdresse = (field, value) => {
    setForm((current) => ({
      ...current,
      adresse: { ...current.adresse, [field]: value },
    }))
    setErrors((current) => ({
      ...current,
      adresse: { ...current.adresse, [field]: undefined },
    }))
  }

  const startCreate = () => {
    setForm(createEmptyFlowParent(config.gender, phone.trim()))
    setErrors({})
    setFeedback(null)
    setIsCreating(true)
  }

  const search = async () => {
    if (!phone.trim()) {
      setFeedback({ type: 'error', message: 'Saisissez un numero de telephone.' })
      return
    }

    setIsSearching(true)
    setFeedback(null)

    try {
      const payload = await searchParentsByPhone(phone.trim())
      const matchingParents = normalizeCollection(payload)
        .filter((parent) => parent.gender === config.gender)

      setResults(matchingParents)
      if (!matchingParents.length) {
        setFeedback({
          type: 'info',
          message: `Aucun ${config.title.toLowerCase()} trouve. Vous pouvez le creer.`,
        })
      }
    } catch (error) {
      setResults([])
      setFeedback({ type: 'error', message: error.message })
    } finally {
      setIsSearching(false)
    }
  }

  const saveParent = async () => {
    const nextErrors = validateFlowParent(form)
    setErrors(nextErrors)

    if (hasValidationErrors(nextErrors)) {
      setFeedback({ type: 'error', message: 'Completez les champs obligatoires.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      const payload = await createParent(getCreateFlowParentPayload(form))
      const createdParent = unwrapParent(payload)

      if (!createdParent?.id) {
        throw new Error('Le parent a ete cree sans identifiant exploitable.')
      }

      onSelect(createdParent)
      setIsCreating(false)
      setResults([])
      setPhone('')
      setFeedback({ type: 'success', message: `${config.title} ajoute et selectionne.` })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  if (selectedParent) {
    return (
      <article className='full-flow-parent-card full-flow-parent-card-selected'>
        <div>
          <p className='full-flow-eyebrow'>{config.title}</p>
          <h3>{getParentName(selectedParent)}</h3>
          <p>{selectedParent.phone || 'Telephone non renseigne'}</p>
        </div>

        <Button
          type='button'
          variant='secondary'
          label='Remplacer'
          onClick={() => onSelect(null)}
          className='inscription-action inscription-action--secondary'
        />
      </article>
    )
  }

  return (
    <article className='full-flow-parent-card'>
      <div>
        <p className='full-flow-eyebrow'>{config.title}</p>
        <h3>Selectionner ou creer le {config.title.toLowerCase()}</h3>
        <p>{config.description}</p>
      </div>

      {!isCreating && (
        <>
          <div className='full-flow-search-row'>
            <Input
              id={`full-flow-${role}-phone`}
              label='Telephone'
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
            <Button
              type='button'
              label='Rechercher'
              onClick={search}
              loading={isSearching}
              className='inscription-action inscription-action--primary'
            />
          </div>

          {feedback && <Feedback type={feedback.type} message={feedback.message} />}

          {results.length > 0 && (
            <div className='full-flow-parent-results'>
              {results.map((parent) => (
                <button
                  key={parent.id}
                  type='button'
                  className='full-flow-parent-result'
                  onClick={() => onSelect(parent)}
                >
                  <strong>{getParentName(parent)}</strong>
                  <span>{parent.phone || 'Telephone non renseigne'}</span>
                </button>
              ))}
            </div>
          )}

          <Button
            type='button'
            variant='secondary'
            label={`Creer un nouveau ${config.title.toLowerCase()}`}
            onClick={startCreate}
            className='inscription-action inscription-action--secondary'
          />
        </>
      )}

      {isCreating && (
        <div className='full-flow-parent-create'>
          <h4>Nouveau {config.title.toLowerCase()}</h4>

          <div className='full-flow-form-grid'>
            <Input
              id={`full-flow-${role}-name`}
              label='Nom complet'
              value={form.full_name}
              onChange={(event) => updateForm('full_name', event.target.value)}
              error={errors.full_name}
              required
            />
            <Input
              id={`full-flow-${role}-create-phone`}
              label='Telephone'
              value={form.phone}
              onChange={(event) => updateForm('phone', event.target.value)}
              error={errors.phone}
              required
            />
            <Input
              id={`full-flow-${role}-profession`}
              label='Profession'
              value={form.profession}
              onChange={(event) => updateForm('profession', event.target.value)}
              error={errors.profession}
              required
            />
          </div>

          <label className='full-flow-checkbox'>
            <input
              type='checkbox'
              checked={form.withAdresse}
              onChange={(event) => updateForm('withAdresse', event.target.checked)}
            />
            Ajouter une adresse
          </label>

          {form.withAdresse && (
            <FlowAdresseFields
              idPrefix={`full-flow-${role}-adresse`}
              form={form.adresse}
              errors={errors.adresse}
              onChange={updateAdresse}
            />
          )}

          {feedback && <Feedback type={feedback.type} message={feedback.message} />}

          <div className='full-flow-inline-actions'>
            <Button
              type='button'
              variant='secondary'
              label='Annuler'
              onClick={() => setIsCreating(false)}
              disabled={isSaving}
              className='inscription-action inscription-action--secondary'
            />
            <Button
              type='button'
              label='Ajouter le parent'
              onClick={saveParent}
              loading={isSaving}
              className='inscription-action inscription-action--primary'
            />
          </div>
        </div>
      )}
    </article>
  )
}

export default FullFlowParentCard
