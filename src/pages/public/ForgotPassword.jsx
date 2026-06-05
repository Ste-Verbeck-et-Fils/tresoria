import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Feedback from '../../components/ui/Feedback'
import '../../styles/public/Auth.css'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
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
    setPhone(e.target.value)
    if (error) setError('')
  }

  const validate = () => {
    if (!phone.trim()) {
      setError('Le numéro de téléphone est requis')
      return false
    } else if (!/^\+?\d{9,15}$/.test(phone.replace(/\s+/g, ''))) {
      setError('Veuillez entrer un numéro valide')
      return false
    }
    return true
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
        if (phone === '+243000000000') {
          showMessage('error', 'Aucun compte associé à ce numéro.')
        } else {
          showMessage('success', 'Demande envoyée ! Vous recevrez un SMS avec les instructions pour réinitialiser votre mot de passe.')
          setTimeout(() => navigate('/verify-code'), 1500)
        }
      }, 1000)
    }
  }

  return (
    <div className='public-site-theme'>
      <Header />
      <div className='auth-page'>
        <div className='auth-card'>
          <h1 className='section-title'>
            <span className='brush-bg-text'>CONNEXION</span>
          </h1>
          <p className='auth-subtitle'>
            Entrez votre numéro de téléphone. Nous vous enverrons les instructions pour réinitialiser votre mot de passe.
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

          {!message.text || message.type === 'error'
            ? (
              <form className='auth-form' onSubmit={handleSubmit}>
                <Input
                  id='phone'
                  type='tel'
                  label='Numéro de téléphone'
                  value={phone}
                  onChange={handleChange}
                  error={error}
                  placeholder='Ex: +243814717237'
                  disabled={isLoading}
                />

                <Button
                  type='submit'
                  variant='super'
                  label={isLoading ? 'Envoi en cours...' : 'Envoyer la demande'}
                  className='auth-submit-btn-mt'
                  disabled={isLoading}
                />
              </form>
              )
            : null}

          <div className='auth-footer-text-large'>
            <span onClick={() => navigate('/login')} className='auth-link'> Retour à la connexion</span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default ForgotPassword
