import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Feedback from '../../components/ui/Feedback'
import '../../styles/public/Auth.css'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ phone: '', password: '' })
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
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis'
    } else if (!/^\+?\d{9,15}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Veuillez entrer un numéro valide'
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
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
        if (formData.phone === '+243814717237' && formData.password === 'admin') {
          showMessage('success', 'Connexion réussie ! Redirection...')
          setTimeout(() => navigate('/dashboard'), 1500)
        } else if (formData.phone === '+243814717237') {
          showMessage('error', 'Mot de passe incorrect.')
        } else {
          // Accept any other valid phone format for testing
          showMessage('success', 'Connexion réussie ! Redirection...')
          setTimeout(() => navigate('/dashboard'), 1500)
        }
      }, 1000)
    }
  }

  return (
    <>
      <Header />
      <div className='auth-page'>
        <div className='auth-card'>
          <h1 className='section-title'>
            <span className='brush-bg-text'>CONNEXION</span>
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
              id={'1'}
              type={'tel'}
              label={'Numéro de téléphone'}
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder={'Ex: +243814717237'}
              disabled={isLoading}
            />

            <Input
              id={'2'}
              type={'password'}
              label={'Mot de passe'}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder='Votre mot de passe'
              disabled={isLoading}
            />

            <div className='auth-options'>
            </div>

            <Button
              type={'submit'}
              variant={'super'}
              label={isLoading ? 'Connexion...' : 'Se connecter'}
              className={'auth-submit-btn'}
              disabled={isLoading}

            />

            <div className='auth-footer-text'>
              <span className='auth-text-muted'>Vous n'avez pas de compte ? </span>
              <span onClick={() => navigate('/register')} className='auth-link'>Créer un compte</span>
              <br />
              <span className='auth-text-muted'>Mot de passe oublié ? </span><span onClick={() => navigate('/forgot-password')} className='auth-link'>cliquer ici</span>

            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Login
