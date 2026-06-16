import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, UserRound } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SelectField from '../../inscriptions/components/SelectField'
import Feedback from '../../../components/ui/Feedback'
import Loader from '../../../components/ui/Loader'
import { getUserById, updateUser, resetUserPassword } from '../../../services/userService'
import '../styles/users.css'

const UserDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const userStr = localStorage.getItem('user')
  const currentUser = userStr ? JSON.parse(userStr) : {}

  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    role: '',
    statut: 'ACTIF'
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [resetFeedback, setResetFeedback] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      try {
        const payload = await getUserById(id)
        const fetchedUser = payload.data || payload // handle both cases just in case
        setUser(fetchedUser)
        setForm({
          full_name: fetchedUser.full_name || '',
          phone: fetchedUser.phone || '',
          role: fetchedUser.role || '',
          statut: fetchedUser.statut || 'ACTIF'
        })
      } catch (error) {
        setLoadError(error.message || 'Impossible de charger les informations de l\'utilisateur.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [id])

  // Rôles disponibles en fonction de l'utilisateur actuel
  const roleOptions = [
    { value: 'PARENT', label: 'PARENT' },
    { value: 'COMPTABLE', label: 'COMPTABLE' },
  ]
  if (currentUser.role === 'SUPER_ADMIN') {
    roleOptions.push({ value: 'ADMIN', label: 'ADMIN' })
  }

  // Keep original role if not in options (e.g. SUPER_ADMIN)
  if (user && user.role && !roleOptions.find(o => o.value === user.role)) {
    roleOptions.push({ value: user.role, label: user.role })
  }

  const validate = () => {
    const newErrors = {}
    if (!form.full_name) newErrors.full_name = 'Le nom est requis'
    if (!form.phone) newErrors.phone = 'Le numéro de téléphone est requis'
    else if (!/^[0-9+]+$/.test(form.phone)) newErrors.phone = 'Format de numéro invalide'
    if (!form.role) newErrors.role = 'Le rôle est requis'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm(prev => ({ ...prev, [id]: value }))
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }))
    }
  }

  const handleToggleStatus = (e) => {
    setForm(prev => ({ ...prev, statut: e.target.checked ? 'ACTIF' : 'INACTIF' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSuccessMessage('')
    setResetFeedback('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await updateUser(user.id, form)
      setSuccessMessage('Les informations de l\'utilisateur ont été mises à jour avec succès.')
      setIsEditing(false)
    } catch (error) {
      setSubmitError(error.message || "Impossible de modifier l'utilisateur.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async () => {
    if (!window.confirm('Voulez-vous réinitialiser le mot de passe de cet utilisateur ? Un SMS lui sera envoyé.')) return

    setIsResetting(true)
    setResetFeedback('')
    setSuccessMessage('')
    try {
      await resetUserPassword(user.id)
      setResetFeedback('Mot de passe réinitialisé avec succès et envoyé par SMS.')
    } catch (error) {
      setSubmitError(error.message || 'Erreur lors de la réinitialisation du mot de passe')
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return <Loader message='Chargement des détails...' />
  }

  if (loadError) {
    return (
      <section className='inscription-page'>
        <div style={{ padding: '24px' }}>
          <Feedback type='error' message={loadError} />
          <Button onClick={() => navigate('/users')} label='Retour aux utilisateurs' variant='outline' style={{ marginTop: '16px' }} />
        </div>
      </section>
    )
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/users' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux utilisateurs
          </Link>
        </div>
      </header>

      {submitError && <Feedback type='error' message={submitError} onClose={() => setSubmitError('')} />}
      {successMessage && <Feedback type='success' message={successMessage} onClose={() => setSuccessMessage('')} />}
      {resetFeedback && <Feedback type='success' message={resetFeedback} onClose={() => setResetFeedback('')} />}

      <div className='inscription-form-container'>

        <div className='inscription-form-section' style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          <Button
            type='button'
            variant='secondary'
            label={isResetting ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            icon={<RefreshCw size={14} />}
            onClick={handleResetPassword}
            disabled={isResetting || isSubmitting}
          />
        </div>

        <form onSubmit={handleSubmit} className='inscription-form-section'>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <img
              src={user?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.full_name || 'U')}`}
              alt="Photo de profil"
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <h2 className='inscription-form-section-title' style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>

              Informations de l'utilisateur
            </h2>
          </div>

          <div className='user-form-grid'>
            <Input
              id='full_name'
              type='text'
              label='Nom complet'
              value={form.full_name}
              onChange={handleChange}
              error={errors.full_name}
              disabled={!isEditing || isSubmitting}
              required
            />

            <Input
              id='phone'
              type='text'
              label='Téléphone'
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
              disabled={!isEditing || isSubmitting}
              required
            />

            <SelectField
              id='role'
              value={form.role}
              onChange={handleChange}
              options={roleOptions}
              error={errors.role}
              disabled={!isEditing || isSubmitting}
              required
            />
          </div>

          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>Statut du compte</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="user-status-switch">
                <input
                  type="checkbox"
                  checked={form.statut === 'ACTIF'}
                  onChange={handleToggleStatus}
                  disabled={!isEditing || isSubmitting}
                />
                <span className="user-status-slider"></span>
              </label>
              <span style={{ fontSize: '0.875rem', color: form.statut === 'ACTIF' ? '#10b981' : '#64748b', fontWeight: 600 }}>
                {form.statut === 'ACTIF' ? 'ACTIF' : 'INACTIF'}
              </span>
            </div>
          </div>

          <div className='inscription-form-actions'>
            {!isEditing ? (
              <Button
                type='button'
                variant='super'
                label='Modifier les informations'
                onClick={() => setIsEditing(true)}
                className='inscription-action inscription-action--primary'
              />
            ) : (
              <>
                <Button
                  type='button'
                  variant='ghost'
                  label='Annuler'
                  onClick={() => {
                    setIsEditing(false)
                    setForm({
                      full_name: user.full_name || '',
                      phone: user.phone || '',
                      role: user.role || '',
                      statut: user.statut || 'ACTIF'
                    })
                    setErrors({})
                  }}
                  disabled={isSubmitting}
                />
                <Button
                  type='submit'
                  variant='super'
                  label={isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className='inscription-action inscription-action--primary'
                />
              </>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}

export default UserDetailPage
