import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Feedback from '../../components/ui/Feedback'
import '../../styles/public/Auth.css'

const VerifyCode = () => {
  const navigate = useNavigate()
  const [code, setCode] = useState(new Array(6).fill(''))
  const [error, setError] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(false)
  const messageTimeoutRef = useRef(null)
  const inputRefs = useRef([])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    messageTimeoutRef.current = setTimeout(() => {
      setMessage({ type: '', text: '' })
    }, 5000)
  }

  const handleChange = (e, index) => {
    const value = e.target.value
    if (isNaN(value)) return

    const newCode = [...code]
    // allow only one digit
    newCode[index] = value.substring(value.length - 1)
    setCode(newCode)
    if (error) setError('')

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  const validate = () => {
    if (code.some(digit => digit === '')) {
      setError('Veuillez entrer les 6 chiffres du code')
      return false
    }
    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    setMessage({ type: '', text: '' })
    setError('')

    if (validate()) {
      setIsLoading(true)

      // Mock API call
      setTimeout(() => {
        setIsLoading(false)
        showMessage('success', 'Code vérifié !')
        setTimeout(() => navigate('/reset-password'), 1500)
      }, 1000)
    }
  }

  const handleResend = () => {
    showMessage('success', 'Un nouveau code a été envoyé.')
  }

  return (
    <div className='public-site-theme'>
      <Header />
      <div className='auth-page'>
        <div className='auth-card'>
          <h1 className='section-title'>
            <span className='brush-bg-text'>VÉRIFICATION</span>
          </h1>
          <p className='auth-subtitle'>
            Entrez le code à 6 chiffres que vous avez reçu par SMS.
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

          {error && (
            <div className='auth-message error'>
              {error}
            </div>
          )}

          <form className='auth-form' onSubmit={handleSubmit}>
            <div className='auth-code-container'>
              {code.map((data, index) => (
                <input
                  key={index}
                  type='number'
                  className='auth-code-input'
                  value={data}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  disabled={isLoading}
                />
              ))}
            </div>

            <Button
              type='submit'
              variant='super'
              label={isLoading ? 'Vérification...' : 'Vérifier le code'}
              className='auth-submit-btn-mt'
              disabled={isLoading}
            />
          </form>

          <div className='auth-footer-text-large'>
            <span className='auth-text-muted'>Vous n'avez pas reçu de code ?</span>
            <span onClick={handleResend} className='auth-link' style={{ marginLeft: 0 }}>Renvoyer le code</span>
            <br />
            <br />
            <span onClick={() => navigate('/login')} className='auth-link' style={{ marginLeft: 0 }}> Retour à la connexion</span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default VerifyCode
