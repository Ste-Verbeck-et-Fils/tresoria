import Loader from '../../../components/ui/Loader'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, PencilLine, Plus, Trash2, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import DetailField from '../../inscriptions/components/DetailField'
import DetailSection from '../../inscriptions/components/DetailSection'
import DetailSummaryCard from '../../inscriptions/components/DetailSummaryCard'
import ModuleState from '../../inscriptions/components/ModuleState'
import { formatDate, normalizeCollection } from '../../inscriptions/utils/data'
import {
  createAdresse,
  deleteAdresse,
  deleteParent,
  getParent,
  getParentAdresses,
  updateAdresse,
  updateParent,
} from '../../../services/parentService'
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

const ParentDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [parent, setParent] = useState(null)
  const [adresses, setAdresses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editForm, setEditForm] = useState(normalizeParentForm())
  const [editErrors, setEditErrors] = useState({})
  const [adresseMode, setAdresseMode] = useState('')
  const [editingAdresseId, setEditingAdresseId] = useState(null)
  const [adresseForm, setAdresseForm] = useState(normalizeAdresseForm())
  const [adresseErrors, setAdresseErrors] = useState({})
  const [isSavingAdresse, setIsSavingAdresse] = useState(false)
  const [deletingAdresseId, setDeletingAdresseId] = useState(null)

  const loadParentData = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const [parentPayload, adressesPayload] = await Promise.all([
        getParent(id),
        getParentAdresses(id),
      ])

      setParent(unwrapParent(parentPayload))
      setAdresses(normalizeCollection(adressesPayload))
    } catch (error) {
      setLoadError(error.message || 'Impossible de charger ce parent.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAdresses = async () => {
    const payload = await getParentAdresses(id)
    setAdresses(normalizeCollection(payload))
  }

  useEffect(() => {
    let isCancelled = false

    Promise.all([
      getParent(id),
      getParentAdresses(id),
    ])
      .then(([parentPayload, adressesPayload]) => {
        if (!isCancelled) {
          setParent(unwrapParent(parentPayload))
          setAdresses(normalizeCollection(adressesPayload))
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setLoadError(error.message || 'Impossible de charger ce parent.')
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
  }, [id])

  const handleStartEdit = () => {
    setEditForm(normalizeParentForm(parent))
    setEditErrors({})
    setFeedback({ type: '', message: '' })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditForm(normalizeParentForm(parent))
    setEditErrors({})
    setFeedback({ type: '', message: '' })
    setIsEditing(false)
  }

  const handleEditChange = (event) => {
    const { id: fieldId, value } = event.target
    setEditForm((currentForm) => ({ ...currentForm, [fieldId]: value }))

    if (editErrors[fieldId]) {
      setEditErrors((currentErrors) => ({ ...currentErrors, [fieldId]: '' }))
    }
  }

  const handleSaveEdit = async () => {
    setFeedback({ type: '', message: '' })

    const nextErrors = validateParentForm(editForm)
    setEditErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)

    try {
      const payload = await updateParent(id, getParentPayload(editForm))
      const updatedParent = unwrapParent(payload)

      setParent(updatedParent)
      setEditForm(normalizeParentForm(updatedParent))
      setIsEditing(false)
      setFeedback({ type: 'success', message: 'Parent modifie avec succes.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible d enregistrer ce parent.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteParent = async () => {
    const isConfirmed = window.confirm(`Supprimer le parent "${parent.full_name}" ? Cette action est irreversible.`)

    if (!isConfirmed) {
      return
    }

    setFeedback({ type: '', message: '' })
    setIsDeleting(true)

    try {
      await deleteParent(id)
      navigate('/parents', {
        replace: true,
        state: { successMessage: 'Parent supprime avec succes.' },
      })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de supprimer ce parent.' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStartCreateAdresse = () => {
    setAdresseMode('create')
    setEditingAdresseId(null)
    setAdresseForm(normalizeAdresseForm())
    setAdresseErrors({})
    setFeedback({ type: '', message: '' })
  }

  const handleStartEditAdresse = (adresse) => {
    setAdresseMode('edit')
    setEditingAdresseId(adresse.id)
    setAdresseForm(normalizeAdresseForm(adresse))
    setAdresseErrors({})
    setFeedback({ type: '', message: '' })
  }

  const handleCancelAdresse = () => {
    setAdresseMode('')
    setEditingAdresseId(null)
    setAdresseForm(normalizeAdresseForm())
    setAdresseErrors({})
  }

  const handleAdresseChange = (event) => {
    const { id: fieldId, value } = event.target
    setAdresseForm((currentForm) => ({ ...currentForm, [fieldId]: value }))

    if (adresseErrors[fieldId]) {
      setAdresseErrors((currentErrors) => ({ ...currentErrors, [fieldId]: '' }))
    }
  }

  const handleSaveAdresse = async (event) => {
    event.preventDefault()
    setFeedback({ type: '', message: '' })

    const nextErrors = validateAdresseForm(adresseForm)
    setAdresseErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSavingAdresse(true)

    try {
      const payload = getAdressePayload(adresseForm, id)

      if (adresseMode === 'edit') {
        await updateAdresse(editingAdresseId, payload)
      } else {
        await createAdresse(payload)
      }

      await loadAdresses()
      handleCancelAdresse()
      setFeedback({
        type: 'success',
        message: adresseMode === 'edit'
          ? 'Adresse modifiee avec succes.'
          : 'Adresse ajoutee avec succes.',
      })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible d enregistrer cette adresse.' })
    } finally {
      setIsSavingAdresse(false)
    }
  }

  const handleDeleteAdresse = async (adresse) => {
    const isConfirmed = window.confirm(`Supprimer l adresse #${adresse.id} ? Cette action est irreversible.`)

    if (!isConfirmed) {
      return
    }

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

  const isActionPending = isSaving || isDeleting || isSavingAdresse || Boolean(deletingAdresseId)

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/parents' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux parents
          </Link>
          <h1>Detail du parent #{id}</h1>
          
        </div>
      </header>

      {location.state?.successMessage && <Feedback type='success' message={location.state.successMessage} />}
      {location.state?.warningMessage && <Feedback type='warning' message={location.state.warningMessage} />}

      {feedback.message && (
        <Feedback
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}

      {isLoading && <Loader message='Chargement du parent...' />}

      {!isLoading && loadError && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={loadError}
          actionLabel='Reessayer'
          onAction={loadParentData}
        />
      )}

      {!isLoading && !loadError && parent && (
        <div className='detail-page-stack'>
          <DetailSummaryCard
            icon={<UserRound size={34} aria-hidden='true' />}
            title={parent.full_name}
            subtitle={`Parent #${parent.id}`}
            meta={parent.phone || '-'}
          />

          <DetailSection
            title='Informations du parent'
            actions={(
              isEditing
                ? (
                  <>
                    <Button
                      type='button'
                      variant='ghost'
                      label='Annuler'
                      disabled={isSaving}
                      onClick={handleCancelEdit}
                      className='inscription-action inscription-action--secondary'
                    />
                    <Button
                      type='button'
                      variant='super'
                      label={isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      loading={isSaving}
                      onClick={handleSaveEdit}
                      className='inscription-action inscription-action--primary'
                    />
                  </>
                  )
                : (
                  <Button
                    type='button'
                    variant='ghost'
                    label='Modifier'
                    icon={<PencilLine size={16} />}
                    disabled={isActionPending}
                    onClick={handleStartEdit}
                    className='inscription-action inscription-action--secondary'
                  />
                  )
            )}
          >
            <DetailField label='Reference' value={`#${parent.id}`} />
            {isEditing
              ? (
                <>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Nom complet</dt>
                    <dd>
                      <Input
                        id='full_name'
                        type='text'
                        value={editForm.full_name}
                        error={editErrors.full_name}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Telephone</dt>
                    <dd>
                      <Input
                        id='phone'
                        type='tel'
                        value={editForm.phone}
                        error={editErrors.phone}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Genre</dt>
                    <dd>
                      <select
                        id='gender'
                        value={editForm.gender}
                        disabled={isSaving}
                        onChange={handleEditChange}
                        className={editErrors.gender ? 'inscription-select inscription-select--error' : 'inscription-select'}
                      >
                        <option value=''>-</option>
                        {GENDER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      {editErrors.gender && <span className='inscription-field-error'>{editErrors.gender}</span>}
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Profession</dt>
                    <dd>
                      <Input
                        id='profession'
                        type='text'
                        value={editForm.profession}
                        error={editErrors.profession}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                </>
                )
              : (
                <>
                  <DetailField label='Nom complet' value={parent.full_name} />
                  <DetailField label='Telephone' value={parent.phone} />
                  <DetailField label='Genre' value={parent.gender} />
                  <DetailField label='Profession' value={parent.profession} />
                </>
                )}
          </DetailSection>

          <article className='detail-section-card parent-address-section'>
            <header className='detail-section-card__header'>
              <h2>Adresses du parent</h2>
              {!adresseMode && (
                <Button
                  type='button'
                  variant='ghost'
                  label='Ajouter une adresse'
                  icon={<Plus size={16} />}
                  disabled={isActionPending || isEditing}
                  onClick={handleStartCreateAdresse}
                  className='inscription-action inscription-action--secondary'
                />
              )}
            </header>

            {adresseMode && (
              <form className='parent-address-inline-form' onSubmit={handleSaveAdresse}>
                <h3>{adresseMode === 'edit' ? 'Modifier l adresse' : 'Nouvelle adresse'}</h3>
                <div className='parent-address-form-grid'>
                  <label className='parent-address-form-field'>
                    <span>Commune</span>
                    <Input
                      id='commune'
                      type='text'
                      value={adresseForm.commune}
                      error={adresseErrors.commune}
                      disabled={isSavingAdresse}
                      onChange={handleAdresseChange}
                    />
                  </label>
                  <label className='parent-address-form-field'>
                    <span>Quartier</span>
                    <Input
                      id='quartier'
                      type='text'
                      value={adresseForm.quartier}
                      error={adresseErrors.quartier}
                      disabled={isSavingAdresse}
                      onChange={handleAdresseChange}
                    />
                  </label>
                  <label className='parent-address-form-field'>
                    <span>Avenue</span>
                    <Input
                      id='avenue'
                      type='text'
                      value={adresseForm.avenue}
                      error={adresseErrors.avenue}
                      disabled={isSavingAdresse}
                      onChange={handleAdresseChange}
                    />
                  </label>
                  <label className='parent-address-form-field'>
                    <span>Numero</span>
                    <Input
                      id='numero'
                      type='text'
                      value={adresseForm.numero}
                      disabled={isSavingAdresse}
                      onChange={handleAdresseChange}
                    />
                  </label>
                </div>
                <div className='parent-address-form-actions'>
                  <Button
                    type='button'
                    variant='ghost'
                    label='Annuler'
                    disabled={isSavingAdresse}
                    onClick={handleCancelAdresse}
                    className='inscription-action inscription-action--secondary'
                  />
                  <Button
                    type='submit'
                    variant='super'
                    label={isSavingAdresse ? 'Enregistrement...' : 'Enregistrer'}
                    loading={isSavingAdresse}
                    className='inscription-action inscription-action--primary'
                  />
                </div>
              </form>
            )}

            {!adresseMode && adresses.length === 0 && (
              <p className='parent-address-empty'>Aucune adresse enregistree pour ce parent.</p>
            )}

            {!adresseMode && adresses.length > 0 && (
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
                    <div className='parent-address-card__actions'>
                      <Button
                        type='button'
                        variant='ghost'
                        label='Modifier'
                        icon={<PencilLine size={15} />}
                        disabled={isActionPending || isEditing}
                        onClick={() => handleStartEditAdresse(adresse)}
                        className='inscription-action inscription-action--secondary'
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        label={deletingAdresseId === adresse.id ? 'Suppression...' : 'Supprimer'}
                        icon={<Trash2 size={15} />}
                        loading={deletingAdresseId === adresse.id}
                        disabled={isEditing}
                        onClick={() => handleDeleteAdresse(adresse)}
                        className='inscription-action classe-delete-action'
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>

          <DetailSection
            title='Suivi du parent'
            actions={(
              <Button
                type='button'
                variant='ghost'
                label={isDeleting ? 'Suppression...' : 'Supprimer'}
                icon={<Trash2 size={16} />}
                loading={isDeleting}
                disabled={isEditing || Boolean(adresseMode)}
                onClick={handleDeleteParent}
                className='inscription-action classe-delete-action'
              />
            )}
          >
            <DetailField label='Date de creation' value={formatDate(parent.created_at)} />
            <DetailField label='Derniere modification' value={formatDate(parent.updated_at)} />
          </DetailSection>
        </div>
      )}
    </section>
  )
}

export default ParentDetailPage
