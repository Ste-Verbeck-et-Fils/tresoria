import React, { useState } from 'react'
import { MapPin, PencilLine, Plus, Trash2 } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import {
  createAdresse,
  deleteAdresse,
  updateAdresse,
} from '../../../services/studentService'
import PasswordConfirmModal from '../../../components/ui/PasswordConfirmModal'
import {
  getStudentAdressePayload,
  normalizeAdresseForm,
  validateAdresseForm,
} from '../../inscriptions/utils/adresse'

const StudentAdresseManager = ({
  studentId,
  adresses,
  loadAdresses,
  disabled = false,
  readOnly = false,
}) => {
  const [mode, setMode] = useState('')
  const [editingAdresseId, setEditingAdresseId] = useState(null)
  const [form, setForm] = useState(normalizeAdresseForm())
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [deletingAdresseId, setDeletingAdresseId] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingDeleteAdresse, setPendingDeleteAdresse] = useState(null)

  const handleStartCreate = () => {
    setMode('create')
    setEditingAdresseId(null)
    setForm(normalizeAdresseForm())
    setErrors({})
    setFeedback({ type: '', message: '' })
  }

  const handleStartEdit = (adresse) => {
    setMode('edit')
    setEditingAdresseId(adresse.id)
    setForm(normalizeAdresseForm(adresse))
    setErrors({})
    setFeedback({ type: '', message: '' })
  }

  const handleCancel = () => {
    setMode('')
    setEditingAdresseId(null)
    setForm(normalizeAdresseForm())
    setErrors({})
  }

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [id]: value }))

    if (errors[id]) {
      setErrors((currentErrors) => ({ ...currentErrors, [id]: '' }))
    }
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setFeedback({ type: '', message: '' })

    const nextErrors = validateAdresseForm(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)

    try {
      const payload = getStudentAdressePayload(form, studentId)

      if (mode === 'edit') {
        await updateAdresse(editingAdresseId, payload)
      } else {
        await createAdresse(payload)
      }

      await loadAdresses()
      handleCancel()
      setFeedback({
        type: 'success',
        message: mode === 'edit'
          ? 'Adresse modifiee avec succes.'
          : 'Adresse ajoutee avec succes.',
      })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible d enregistrer cette adresse.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = (adresse) => {
    setPendingDeleteAdresse(adresse)
    setShowPasswordModal(true)
  }

  const executeDelete = async () => {
    const adresse = pendingDeleteAdresse
    setShowPasswordModal(false)
    setPendingDeleteAdresse(null)

    setFeedback({ type: '', message: '' })
    setDeletingAdresseId(adresse.id)

    try {
      await deleteAdresse(adresse.id)
      await loadAdresses()
      setFeedback({ type: 'success', message: 'Adresse supprimee avec succes.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de supprimer cette adresse.' })
    } finally {
      setDeletingAdresseId(null)
    }
  }

  const isPending = isSaving || Boolean(deletingAdresseId)

  return (
    <>
      <article className='detail-section-card parent-address-section'>
        <header className='detail-section-card__header'>
          <h2>Adresses de l eleve</h2>
          {!mode && !readOnly && adresses.length < 3 && (
            <Button
              type='button'
              variant='ghost'
              label='Ajouter une adresse'
              icon={<Plus size={16} />}
              disabled={disabled || isPending}
              onClick={handleStartCreate}
              className='inscription-action inscription-action--secondary'
            />
          )}
        </header>

        {feedback.message && (
          <Feedback
            type={feedback.type}
            message={feedback.message}
            onClose={() => setFeedback({ type: '', message: '' })}
            className='student-address-feedback'
          />
        )}

        {mode && (
          <form className='parent-address-inline-form' onSubmit={handleSave}>
            <h3>{mode === 'edit' ? 'Modifier l adresse' : 'Nouvelle adresse'}</h3>
            <div className='parent-address-form-grid'>
              <label className='parent-address-form-field'>
                <span>Commune</span>
                <Input
                  id='commune'
                  type='text'
                  value={form.commune}
                  disabled={isSaving}
                  onChange={handleChange}
                />
              </label>
              <label className='parent-address-form-field'>
                <span>Quartier</span>
                <Input
                  id='quartier'
                  type='text'
                  value={form.quartier}
                  error={errors.quartier}
                  disabled={isSaving}
                  onChange={handleChange}
                />
              </label>
              <label className='parent-address-form-field'>
                <span>Avenue</span>
                <Input
                  id='avenue'
                  type='text'
                  value={form.avenue}
                  disabled={isSaving}
                  onChange={handleChange}
                />
              </label>
              <label className='parent-address-form-field'>
                <span>Numero</span>
                <Input
                  id='numero'
                  type='text'
                  value={form.numero}
                  disabled={isSaving}
                  onChange={handleChange}
                />
              </label>
            </div>
            <div className='parent-address-form-actions'>
              <Button
                type='button'
                variant='ghost'
                label='Annuler'
                disabled={isSaving}
                onClick={handleCancel}
                className='inscription-action inscription-action--secondary'
              />
              <Button
                type='submit'
                variant='super'
                label={isSaving ? 'Enregistrement...' : 'Enregistrer'}
                loading={isSaving}
                className='inscription-action inscription-action--primary'
              />
            </div>
          </form>
        )}

        {!mode && adresses.length === 0 && (
          <p className='parent-address-empty'>Aucune adresse enregistree pour cet eleve.</p>
        )}

        {!mode && adresses.length > 0 && (
          <div className='parent-address-list'>
            {adresses.map((adresse) => (
              <article key={adresse.id} className='parent-address-card'>
                <div className='parent-address-card__icon'>
                  <MapPin size={19} aria-hidden='true' />
                </div>
                <div className='parent-address-card__content'>
                  <h3>Adresse #{adresse.id}</h3>
                  <p>{[adresse.numero, adresse.avenue, adresse.quartier, adresse.commune].filter(Boolean).join(', ')}</p>
                </div>
                {!readOnly && (
                  <div className='parent-address-card__actions'>
                    <Button
                      type='button'
                      variant='ghost'
                      label='Modifier'
                      icon={<PencilLine size={15} />}
                      disabled={disabled || isPending}
                      onClick={() => handleStartEdit(adresse)}
                      className='inscription-action inscription-action--secondary'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      label={deletingAdresseId === adresse.id ? 'Suppression...' : 'Supprimer'}
                      icon={<Trash2 size={15} />}
                      loading={deletingAdresseId === adresse.id}
                      disabled={disabled}
                      onClick={() => handleDelete(adresse)}
                      className='inscription-action classe-delete-action'
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </article>

      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setPendingDeleteAdresse(null) }}
        onConfirm={executeDelete}
        title='Confirmation requise'
        message='Veuillez saisir votre mot de passe pour confirmer la suppression de cette adresse.'
        actionLabel='Supprimer'
      />
    </>
  )
}

export default StudentAdresseManager
