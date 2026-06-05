import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Feedback from '../../components/ui/Feedback'
import { registerUser } from '../../services/authService'
import '../../styles/public/Auth.css'

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ full_name: '', phone: '', password: '' })
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
    // Clear error on change
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Le nom complet est requis'
    } else if (formData.full_name.trim().length < 3) {
      newErrors.full_name = 'Le nom doit contenir au moins 3 caractères'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis'
    } else if (!/^\+?\d{9,15}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Veuillez entrer un numéro valide'
    }

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    setMessage({ type: '', text: '' })

    if (validate()) {
      setIsLoading(true)

      try {
        await registerUser({
          full_name: formData.full_name,
          phone: formData.phone,
          password: formData.password,
        })

        showMessage('success', 'Inscription réussie ! Redirection vers la connexion...')
        setTimeout(() => navigate('/login'), 2000)
      } catch (error) {
        setErrors({ phone: error.message })
        showMessage('error', error.message || 'Impossible de créer le compte.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className='public-site-theme'>
      <Header />
      <div className='auth-page'>
        <div className='auth-card'>
          <h1 className='section-title'>
            <span className='brush-bg-text'>INSCRIPTION</span>
          </h1>
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
              id='full_name'
              type='text'
              label='Nom complet'
              value={formData.full_name}
              onChange={handleChange}
              error={errors.full_name}
              placeholder='Entrez votre nom'
              disabled={isLoading}
            />

            <Input
              id='phone'
              type='tel'
              label='Numéro de téléphone'
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder='Ex: +243814717237'
              disabled={isLoading}
            />

            <Input
              id='password'
              type='password'
              label='Mot de passe'
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder='Votre mot de passe'
              disabled={isLoading}
            />

            <Button
              type='submit'
              variant='super'
              label={isLoading ? 'Création...' : 'Créer un compte'}
              className='auth-submit-btn-mt'
              disabled={isLoading}
            />

            <div className='auth-footer-text'>
              <span className='auth-text-muted'>Déjà un compte ? </span>
              <span onClick={() => navigate('/login')} className='auth-link'>Se connecter</span>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Register
