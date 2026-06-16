import React, { useState } from 'react'
import { ArrowLeft, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/users.css'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Feedback from '../../../components/ui/Feedback'
import SelectField from '../../inscriptions/components/SelectField'
import { createUser } from '../../../services/userService'

const CreateUserPage = () => {
  const navigate = useNavigate()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : {}

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    role: 'PARENT'
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Rôles disponibles en fonction de l'utilisateur
  const roleOptions = [
    { value: 'PARENT', label: 'PARENT' },
    { value: 'COMPTABLE', label: 'COMPTABLE' },
  ]
  if (user.role === 'SUPER_ADMIN') {
    roleOptions.push({ value: 'ADMIN', label: 'ADMIN' })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await createUser(form)
      navigate('/users', {
        state: { successMessage: 'Compte utilisateur créé avec succès. Le mot de passe a été envoyé par SMS.' },
        replace: true
      })
    } catch (error) {
      setSubmitError(error.message || "Impossible de créer l'utilisateur.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/users' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux utilisateurs
          </Link>
          <h1>Créer un nouveau compte utilisateur</h1>
          <p className='inscription-page-description'>
            Le mot de passe sera généré automatiquement et envoyé par SMS.
          </p>
        </div>
      </header>

      {submitError && (
        <Feedback
          type='error'
          message={submitError}
          onClose={() => setSubmitError('')}
        />
      )}

      <form onSubmit={handleSubmit} className='inscription-form-container'>
        <div className='inscription-form-section'>
          <h2 className='inscription-form-section-title'>
            <UserRound size={20} />
            Informations de l'utilisateur
          </h2>

          <div className='user-form-grid'>
            <Input
              id='full_name'
              type='text'
              label='Nom complet'
              value={form.full_name}
              onChange={handleChange}
              error={errors.full_name}
              disabled={isSubmitting}
              placeholder='Nom complet'
              required
            />
            <Input
              id='phone'
              type='text'
              label='Téléphone'
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
              disabled={isSubmitting}
              placeholder='Telephone'
              required
            />
            <SelectField
              id='role'
              value={form.role}
              onChange={handleChange}
              options={roleOptions}
              error={errors.role}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        <div className='inscription-form-actions'>
          <Button
            type='button'
            variant='ghost'
            label='Annuler'
            onClick={() => navigate('/users')}
            disabled={isSubmitting}
          />
          <Button
            type='submit'
            variant='super'
            label={isSubmitting ? 'Création...' : 'Créer le compte'}
            loading={isSubmitting}
            disabled={isSubmitting}
            className='inscription-action inscription-action--primary'
          />
        </div>
      </form>
    </section>
  )
}

export default CreateUserPage
