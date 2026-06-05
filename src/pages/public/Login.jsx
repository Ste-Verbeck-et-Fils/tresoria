import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Feedback from '../../components/ui/Feedback'
import { loginUser } from '../../services/authService'
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

  const persistSession = (token, user) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('token', token)
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user || { phone: formData.phone }))
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    setMessage({ type: '', text: '' })

    if (validate()) {
      setIsLoading(true)

      try {
        const data = await loginUser({
          phone: formData.phone,
          password: formData.password,
        })

        const token = data.token || data.access_token
        persistSession(token, data.user)

        showMessage('success', 'Connexion réussie ! Redirection...')
        setTimeout(() => navigate('/dashboard/profile', { replace: true }), 1500)
      } catch (error) {
        showMessage('error', error.message || 'Mot de passe ou numéro incorrect.')
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
              label={isLoading ? 'Connexion...' : 'Se connecter'}
              className='auth-submit-btn'
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
    </div>
  )
}

export default Login
