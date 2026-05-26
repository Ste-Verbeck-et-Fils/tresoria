import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { UserCircle2, Phone, ShieldCheck, BadgeCheck, CircleCheckBig, Camera, PencilLine } from 'lucide-react'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { updateUserProfile, normalizeProfile } from '../../../services/profileService'
import '../../../styles/public/ProfileDashboard.css'

const DEFAULT_PROFILE = {
  full_name: '',
  phone: '',
  phone_verify: false,
  photo_url: '',
  role: '',
  statut: '',
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
    new_password: '',
    confirm_password: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})

  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')

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

    if (!passwordForm.new_password && !passwordForm.confirm_password) {
      setPasswordErrors({
        new_password: 'Renseignez un nouveau mot de passe.',
      })
      return false
    }

    if (passwordForm.new_password.length < 8) {
      nextErrors.new_password = 'Le nouveau mot de passe doit contenir au moins 8 caracteres.'
    }

    if (!passwordForm.confirm_password) {
      nextErrors.confirm_password = 'Merci de confirmer le nouveau mot de passe.'
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
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

    // TODO: Brancher un endpoint d'upload fichier quand disponible.
    // Pour l'instant, envoyer photo_url via PATCH si une URL est disponible.
    // Exemple attendu : PATCH /api/users/profile { photo_url: 'https://...' }
    try {
      const updatedProfile = await updateUserProfile({ photo_url: photoPreviewUrl })
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
        message: error.message || 'Impossible de mettre a jour la photo de profil.',
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
      await updateUserProfile({ password: passwordForm.new_password })
      setPasswordForm({
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
      <div className='profile-dashboard__single-column'>
        <article className='profile-card profile-card--single'>
          <h2 className='profile-card__title'>Informations du compte</h2>

          <div className='profile-card__list'>
            <div className='profile-card__item profile-card__item--editable profile-card__item--span-3'>
              <span className='profile-card__label'>Nom complet</span>

              {!isEditingName && (
                <div className='profile-inline-edit'>
                  <span className='profile-card__value profile-card__value--name'>{profile?.full_name || 'Non renseigne'}</span>
                  <button type='button' className='profile-inline-edit__toggle' onClick={handleStartNameEdit} aria-label='Modifier le nom complet'>
                    <PencilLine size={14} />
                    Modifier
                  </button>
                </div>
              )}
              {isEditingName && (
                <div className='profile-inline-edit profile-inline-edit--form'>
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
                  <div className='profile-inline-edit__actions'>
                    <Button
                      type='button'
                      variant='secondary'
                      label='Annuler'
                      onClick={handleCancelNameEdit}
                      disabled={isSavingName}
                    />
                    <Button
                      type='button'
                      variant='super'
                      label={isSavingName
                        ? 'Validation...'
                        : 'Valider'}
                      onClick={handleSaveName}
                      loading={isSavingName}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className='profile-card__item'>
              <span className='profile-card__label'>Telephone</span>
              <span className='profile-card__value'>{profile?.phone || 'Non renseigne'}</span>
            </div>
            <div className='profile-card__item'>
              <span className='profile-card__label'>Telephone verifie</span>
              <span className={`profile-badge ${profile?.phone_verify ? 'profile-badge--success' : 'profile-badge--warning'}`}>
                {profile?.phone_verify ? 'Oui' : 'Non'}
              </span>
            </div>
            <div className='profile-card__item'>
              <span className='profile-card__label'>Role</span>
              <span className='profile-badge profile-badge--info'>{profile?.role || 'Non renseigne'}</span>
            </div>
            <div className='profile-card__item'>
              <span className='profile-card__label'>Statut</span>
              <span className={`profile-badge ${profile?.statut?.toLowerCase() === 'actif' ? 'profile-badge--success' : 'profile-badge--warning'}`}>
                {profile?.statut || 'Inactif'}
              </span>
            </div>

            <div className='profile-card__item profile-card__item--stacked'>
              <span className='profile-card__label'>Nouveau mot de passe</span>
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

            <div className='profile-card__item profile-card__item--stacked'>
              <span className='profile-card__label'>Confirmer le mot de passe</span>
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

            <div className='profile-card__password-action'>
              <Button
                type='button'
                variant='super'
                label={isSavingPassword
                  ? 'Enregistrement...'
                  : 'Changer le mot de passe'}
                onClick={handleChangePassword}
                disabled={isPasswordActionDisabled}
                loading={isSavingPassword}
              />
            </div>
          </div>
        </article>
      </div>
    )
  }

  const displayedAvatar = photoPreviewUrl || profile.photo_url

  return (
    <section className='profile-dashboard'>
      <div className='profile-hero'>
        <div className='profile-hero__left'>
          <button type='button' className='profile-avatar-wrap profile-avatar-wrap--button' onClick={handleOpenPhotoPicker} aria-label='Modifier la photo de profil'>
            {displayedAvatar
              ? <img className='profile-avatar' src={displayedAvatar} alt={profile?.full_name || 'Photo de profil'} />
              : <UserCircle2 className='profile-avatar-fallback' />}
            <span className='profile-avatar-status' />
            <span className='profile-avatar-edit'>
              <Camera size={12} />
              Modifier
            </span>
          </button>

          <div className='profile-hero__identity'>
            <h1 className='profile-dashboard__title'>{profile?.full_name || 'Mon profil'}</h1>
            <p className='profile-dashboard__subtitle'>Gestion de votre compte utilisateur</p>
            <div className='profile-hero__chips'>
              <span className='profile-chip profile-chip--role'>
                <BadgeCheck size={14} />
                {profile?.role || 'Role inconnu'}
              </span>
              <span className={`profile-chip ${profile?.statut?.toLowerCase() === 'actif' ? 'profile-chip--status-active' : 'profile-chip--status-inactive'}`}>
                <CircleCheckBig size={14} />
                {profile?.statut || 'Inactif'}
              </span>
              <span className='profile-chip'>
                <Phone size={14} />
                {profile?.phone || 'Telephone indisponible'}
              </span>
            </div>
          </div>
        </div>

        <div className='profile-hero__right'>
          <div className='profile-preview-flag'>
            <ShieldCheck size={16} />
            Compte securise
          </div>
        </div>
      </div>

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
            variant='secondary'
            label='Annuler la photo'
            onClick={handleCancelPhotoSelection}
            disabled={isSavingPhoto}
          />
          <Button
            type='button'
            variant='super'
            label={isSavingPhoto ? 'Enregistrement photo...' : 'Enregistrer la photo'}
            onClick={handleSavePhoto}
            loading={isSavingPhoto}
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
