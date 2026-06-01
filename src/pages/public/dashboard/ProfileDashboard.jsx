import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { UserCircle2, Camera, PencilLine } from 'lucide-react'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import {
  changeUserPassword,
  normalizeProfile,
  updateUserProfile,
  updateUserProfileFormData,
} from '../../../services/profileService'
import '../../../styles/public/ProfileDashboard.css'

const DEFAULT_PROFILE = {
  full_name: '',
  phone: '',
  phone_verify: false,
  photo_url: '',
  role: '',
  statut: '',
}

const EMPTY_VALUE = 'Non renseigne'

const splitFullName = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return { firstName: '', lastName: '' }
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  }
}

const ProfileDashboard = () => {
  const navigate = useNavigate()
  const { sharedProfile, setSharedProfile, isProfileLoading, profileLoadError } = useOutletContext()
  const photoInputRef = useRef(null)

  // profile est dérivé du contexte partagé, pas d'état local dupliqué
  const profile = sharedProfile ?? DEFAULT_PROFILE

  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [nameError, setNameError] = useState('')

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})

  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const displayedAvatar = photoPreviewUrl || profile.photo_url
  const { firstName, lastName } = splitFullName(profile.full_name)
  const isActiveProfile = profile?.statut?.toLowerCase() === 'actif'

  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isSavingPhoto, setIsSavingPhoto] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl)
      }
    }
  }, [photoPreviewUrl])

  const handlePasswordChange = (event) => {
    const { id, value } = event.target
    setPasswordForm((prev) => ({ ...prev, [id]: value }))

    if (passwordErrors[id]) {
      setPasswordErrors((prev) => ({ ...prev, [id]: '' }))
    }
  }

  const validateName = () => {
    if (!nameDraft.trim()) {
      setNameError('Le nom complet est obligatoire.')
      return false
    }

    setNameError('')
    return true
  }

  const validatePasswordForm = () => {
    const nextErrors = {}

    if (!passwordForm.current_password && !passwordForm.new_password && !passwordForm.confirm_password) {
      setPasswordErrors({
        current_password: 'Renseignez votre ancien mot de passe.',
        new_password: 'Renseignez un nouveau mot de passe.',
      })
      return false
    }

    if (!passwordForm.current_password) {
      nextErrors.current_password = 'Renseignez votre ancien mot de passe.'
    }

    if (!passwordForm.new_password) {
      nextErrors.new_password = 'Renseignez un nouveau mot de passe.'
    } else if (passwordForm.new_password.length < 8) {
      nextErrors.new_password = 'Le nouveau mot de passe doit contenir au moins 8 caracteres.'
    }

    if (!passwordForm.confirm_password) {
      nextErrors.confirm_password = 'Merci de confirmer le nouveau mot de passe.'
    } else if (passwordForm.new_password !== passwordForm.confirm_password) {
      nextErrors.confirm_password = 'La confirmation du mot de passe ne correspond pas.'
    }

    setPasswordErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleOpenPhotoPicker = () => {
    photoInputRef.current?.click()
  }

  const handlePhotoSelected = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    setSelectedPhotoFile(file)
    setPhotoPreviewUrl(previewUrl)
  }

  const handleCancelPhotoSelection = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl)
    }

    setSelectedPhotoFile(null)
    setPhotoPreviewUrl('')

    if (photoInputRef.current) {
      photoInputRef.current.value = ''
    }
  }

  const handleSavePhoto = async () => {
    if (!selectedPhotoFile) {
      return
    }

    setFeedback({ type: '', message: '' })
    setIsSavingPhoto(true)

    try {
      const formData = new FormData()
      formData.append('photo', selectedPhotoFile)

      const updatedProfile = await updateUserProfileFormData(formData)
      const normalizedProfile = normalizeProfile({ ...profile, ...updatedProfile })
      setSharedProfile(normalizedProfile)

      handleCancelPhotoSelection()
      setFeedback({ type: 'success', message: 'Photo de profil mise a jour avec succes.' })
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        navigate('/login', { replace: true })
        return
      }

      setFeedback({
        type: 'error',
        message: error.message?.includes('Aucune') && error.message?.includes('mettre')
          ? 'Selectionnez une image valide avant de l enregistrer.'
          : error.message || 'Impossible de mettre a jour la photo de profil.',
      })
    } finally {
      setIsSavingPhoto(false)
    }
  }

  const handleStartNameEdit = () => {
    setFeedback({ type: '', message: '' })
    setNameDraft(profile.full_name)
    setNameError('')
    setIsEditingName(true)
  }

  const handleCancelNameEdit = () => {
    setNameDraft(profile.full_name)
    setNameError('')
    setIsEditingName(false)
  }

  const handleSaveName = async () => {
    if (!validateName()) {
      return
    }

    setFeedback({ type: '', message: '' })
    setIsSavingName(true)

    try {
      const updatedProfile = await updateUserProfile({ full_name: nameDraft.trim() })
      const normalizedProfile = normalizeProfile({ ...profile, ...updatedProfile })
      setSharedProfile(normalizedProfile)
      setNameDraft(normalizedProfile.full_name)
      setIsEditingName(false)
      setFeedback({ type: 'success', message: 'Nom complet mis a jour avec succes.' })
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        navigate('/login', { replace: true })
        return
      }

      setFeedback({
        type: 'error',
        message: error.message || 'Impossible de mettre a jour le nom complet.',
      })
    } finally {
      setIsSavingName(false)
    }
  }

  const isPasswordActionDisabled =
    isSavingPassword ||
    !passwordForm.current_password ||
    !passwordForm.new_password ||
    !passwordForm.confirm_password ||
    passwordForm.new_password !== passwordForm.confirm_password

  const handleChangePassword = async (event) => {
    event.preventDefault()
    setFeedback({ type: '', message: '' })

    if (!validatePasswordForm()) {
      return
    }

    setIsSavingPassword(true)

    try {
      await changeUserPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      })
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
      setPasswordErrors({})
      setFeedback({ type: 'success', message: 'Mot de passe modifie avec succes.' })
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        navigate('/login', { replace: true })
        return
      }

      setFeedback({
        type: 'error',
        message: error.message || 'Impossible de modifier le mot de passe. Veuillez reessayer.',
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  const renderContent = () => {
    if (isProfileLoading) {
      return <div className='profile-dashboard__loading'>Chargement du profil...</div>
    }

    if (profileLoadError) {
      return (
        <div className='profile-dashboard__state'>
          <Feedback
            type='error'
            title='Echec du chargement'
            message={profileLoadError}
          />
          <Button type='button' variant='secondary' label='Recharger' onClick={() => window.location.reload()} />
        </div>
      )
    }

    return (
      <>
        <article className='profile-section-card'>
          <div className='profile-section-card__header'>
            <h2 className='profile-section-card__title'>Informations personnelles</h2>
            {!isEditingName && (
              <button
                type='button'
                className='profile-edit-button profile-edit-button--primary'
                onClick={handleStartNameEdit}
                aria-label='Modifier les informations personnelles'
              >
                Modifier
                <PencilLine size={14} />
              </button>
            )}
          </div>

          {isEditingName && (
            <div className='profile-name-editor'>
              <Input
                id='inline_full_name'
                type='text'
                label='Nom complet'
                placeholder='Nom complet'
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                error={nameError}
                disabled={isSavingName}
              />
              <div className='profile-name-editor__actions'>
                <Button
                  type='button'
                  variant='ghost'
                  label='Annuler'
                  onClick={handleCancelNameEdit}
                  disabled={isSavingName}
                  className='profile-action-button profile-action-button--ghost'
                />
                <Button
                  type='button'
                  variant='super'
                  label={isSavingName ? 'Validation...' : 'Valider'}
                  onClick={handleSaveName}
                  loading={isSavingName}
                  className='profile-action-button profile-action-button--primary'
                />
              </div>
            </div>
          )}

          <div className='profile-info-grid'>
            <div className='profile-info-field'>
              <span className='profile-info-field__label'>Prenom</span>
              <span className='profile-info-field__value'>{firstName || EMPTY_VALUE}</span>
            </div>
            <div className='profile-info-field'>
              <span className='profile-info-field__label'>Nom</span>
              <span className='profile-info-field__value'>{lastName || EMPTY_VALUE}</span>
            </div>
            <div className='profile-info-field'>
              <span className='profile-info-field__label'>Telephone</span>
              <span className='profile-info-field__value'>{profile?.phone || EMPTY_VALUE}</span>
            </div>
            <div className='profile-info-field'>
              <span className='profile-info-field__label'>Role</span>
              <span className='profile-info-field__value'>{profile?.role || EMPTY_VALUE}</span>
            </div>
            <div className='profile-info-field'>
              <span className='profile-info-field__label'>Statut</span>
              <span className={`profile-info-field__value ${isActiveProfile ? 'profile-info-field__value--success' : 'profile-info-field__value--warning'}`}>
                {profile?.statut || 'Inactif'}
              </span>
            </div>
            <div className='profile-info-field'>
              <span className='profile-info-field__label'>Telephone verifie</span>
              <span className={`profile-info-field__value ${profile?.phone_verify ? 'profile-info-field__value--success' : 'profile-info-field__value--warning'}`}>
                {profile?.phone_verify ? 'Oui' : 'Non'}
              </span>
            </div>
          </div>
        </article>

        <article className='profile-section-card'>
          <div className='profile-section-card__header'>
            <h2 className='profile-section-card__title'>Securite</h2>
          </div>

          <form className='profile-password-form' onSubmit={handleChangePassword}>
            <div className='profile-password-form__field'>
              <span className='profile-password-form__label'>Ancien mot de passe</span>
              <Input
                id='current_password'
                type='password'
                label='Ancien mot de passe'
                placeholder='Ancien mot de passe'
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                error={passwordErrors.current_password}
                disabled={isSavingPassword}
              />
            </div>

            <div className='profile-password-form__field'>
              <span className='profile-password-form__label'>Nouveau mot de passe</span>
              <Input
                id='new_password'
                type='password'
                label='Nouveau mot de passe'
                placeholder='Nouveau mot de passe'
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                error={passwordErrors.new_password}
                disabled={isSavingPassword}
              />
            </div>

            <div className='profile-password-form__field'>
              <span className='profile-password-form__label'>Confirmer le mot de passe</span>
              <Input
                id='confirm_password'
                type='password'
                label='Confirmer le mot de passe'
                placeholder='Confirmer le mot de passe'
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
                error={passwordErrors.confirm_password}
                disabled={isSavingPassword}
              />
            </div>

            <div className='profile-password-form__actions'>
              <Button
                type='submit'
                variant='super'
                label={isSavingPassword
                  ? 'Enregistrement...'
                  : 'Changer le mot de passe'}
                disabled={isPasswordActionDisabled}
                loading={isSavingPassword}
                className='profile-action-button profile-action-button--primary'
              />
            </div>
          </form>
        </article>
      </>
    )
  }

  return (
    <section className='profile-dashboard'>
      <article className='profile-summary-card'>
        <button
          type='button'
          className='profile-avatar-button'
          onClick={handleOpenPhotoPicker}
          aria-label='Modifier la photo de profil'
        >
          {displayedAvatar
            ? <img className='profile-avatar' src={displayedAvatar} alt={profile?.full_name || 'Photo de profil'} />
            : <UserCircle2 className='profile-avatar profile-avatar--fallback' />}
          <span className='profile-avatar-button__camera'>
            <Camera size={13} />
          </span>
        </button>

        <div className='profile-summary-card__identity'>
          <h1 className='profile-dashboard__title'>{profile?.full_name || 'Mon profil'}</h1>
          <p className='profile-dashboard__role'>{profile?.role || 'Role inconnu'}</p>
          <p className='profile-dashboard__meta'>{profile?.phone || 'Telephone indisponible'}</p>
        </div>
      </article>

      <input
        ref={photoInputRef}
        type='file'
        accept='image/*'
        className='profile-photo-input-hidden'
        onChange={handlePhotoSelected}
      />

      {selectedPhotoFile && (
        <div className='profile-photo-actions'>
          <Button
            type='button'
            variant='ghost'
            label='Annuler la photo'
            onClick={handleCancelPhotoSelection}
            disabled={isSavingPhoto}
            className='profile-action-button profile-action-button--ghost'
          />
          <Button
            type='button'
            variant='super'
            label={isSavingPhoto ? 'Enregistrement photo...' : 'Enregistrer la photo'}
            onClick={handleSavePhoto}
            loading={isSavingPhoto}
            className='profile-action-button profile-action-button--primary'
          />
        </div>
      )}

      {feedback.message && (
        <Feedback
          type={feedback.type}
          message={feedback.message}
          className='profile-dashboard__feedback'
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}

      {renderContent()}
    </section>
  )
}

export default ProfileDashboard
