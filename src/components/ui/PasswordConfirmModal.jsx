import React, { useState } from 'react'
import Button from './Button'
import Input from './Input'
import api from '../../services/api'

const PasswordConfirmModal = ({ isOpen, onClose, onConfirm, title, message, actionLabel }) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    setPassword('')
    setError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) {
      setError('Veuillez saisir votre mot de passe.')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const response = await api.post('/auth/verify-password', { password })
      if (response.data.success) {
        onConfirm()
      } else {
        setError('Mot de passe incorrect.')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la vérification du mot de passe.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className='modal-backdrop' style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className='modal-content' style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', maxWidth: '400px', width: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.25rem', fontWeight: 600 }}>{title || 'Confirmation requise'}</h2>
        <p style={{ marginBottom: '24px', color: '#4b5563', fontSize: '0.875rem' }}>{message || 'Veuillez saisir votre mot de passe pour confirmer cette action.'}</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <Input
              id='password-confirm'
              type='password'
              label='Mot de passe'
              placeholder='Votre mot de passe'
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              error={error}
              disabled={isVerifying}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button
              type='button'
              variant='ghost'
              label='Annuler'
              onClick={handleClose}
              disabled={isVerifying}
            />
            <Button
              type='submit'
              variant='super'
              label={isVerifying ? 'Vérification...' : (actionLabel || 'Confirmer')}
              loading={isVerifying}
              className='inscription-action--primary'
            />
          </div>
        </form>
      </div>
    </div>
  )
}

export default PasswordConfirmModal
