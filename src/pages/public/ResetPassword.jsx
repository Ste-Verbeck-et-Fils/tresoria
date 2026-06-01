import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Feedback from '../../components/ui/Feedback'
import '../../styles/public/Auth.css'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(false)
  const messageTimeoutRef = useRef(null)

  const showMessage = (type, text) => {
    setMessage({ type, text })
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    messageTimeoutRef.current = setTimeout(() => {
      setMessage({ type: '', text: '' })
    }, 5000)
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else {
      const hasUpper = /[A-Z]/.test(formData.password)
      const hasLower = /[a-z]/.test(formData.password)
      const hasNumber = /\d/.test(formData.password)
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_]/.test(formData.password)
      
      if (formData.password.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial'
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation est requise'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    setMessage({ type: '', text: '' })

    if (validate()) {
      setIsLoading(true)

      // Mock API call
      setTimeout(() => {
        setIsLoading(false)
        showMessage('success', 'Mot de passe modifié avec succès ! Redirection...')
        setTimeout(() => navigate('/login'), 1500)
      }, 1000)
    }
  }

  return (
    <div className='public-site-theme'>
      <Header />
      <div className='auth-page'>
        <div className='auth-card'>
          <h1 className='section-title'>
            <span className='brush-bg-text'>RÉINITIALISER</span>
          </h1>
          <p className='auth-subtitle'>
            Veuillez entrer votre nouveau mot de passe.
          </p>

          {message.text && (
            <div className='auth-feedback-wrapper'>
              <Feedback
                type={message.type}
                message={message.text}
                onClose={() => {
                  setMessage({ type: '', text: '' })
                  if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
                }}
              />
            </div>
          )}

          <form className='auth-form' onSubmit={handleSubmit}>
            <Input
              id={'password'}
              type={'password'}
              label={'Nouveau mot de passe'}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder='Nouveau mot de passe'
              disabled={isLoading}
            />

            <Input
              id={'confirmPassword'}
              type={'password'}
              label={'Confirmer le mot de passe'}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder='Confirmez le mot de passe'
              disabled={isLoading}
            />

            <Button
              type={'submit'}
              variant={'super'}
              label={isLoading ? 'Enregistrement...' : 'Enregistrer'}
              className={'auth-submit-btn-mt'}
              disabled={isLoading}
            />
          </form>

          <div className='auth-footer-text-large'>
            <span onClick={() => navigate('/login')} className='auth-link'> Retour à la connexion</span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default ResetPassword
