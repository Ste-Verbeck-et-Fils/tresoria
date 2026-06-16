import React, { useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import Feedback from '../../../components/ui/Feedback'
import { sendBulkSms } from '../../../services/smsService'
import '../styles/sms.css'

const SmsPage = () => {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSuccessMessage('')

    if (!message.trim()) {
      setSubmitError('Le message est obligatoire.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await sendBulkSms({ message })
      setSuccessMessage(response.message || 'SMS envoyés avec succès.')
      setMessage('')
    } catch (error) {
      setSubmitError(error.message || "Erreur lors de l'envoi des SMS.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='dashboard-page sms-page'>
      <div className='sms-app-container'>
        <div className='sms-app-header'>
          <h2>
            <MessageSquare size={24} />
            Envoi de SMS Groupés
          </h2>
          <p>Envoyez un message texte important à tous les parents d'élèves enregistrés.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className='sms-app-content'>
            {submitError && <Feedback type='error' message={submitError} onClose={() => setSubmitError('')} />}
            {successMessage && <Feedback type='success' message={successMessage} onClose={() => setSuccessMessage('')} />}

            <div className='sms-app-info-box'>
              <strong>Attention :</strong> Ce message sera directement envoyé sur le téléphone de tous les parents ayant un numéro de contact renseigné. Soyez concis et clair.
            </div>

            <div className='sms-app-input-wrapper'>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder='Écrivez votre message ici...'
                disabled={isSubmitting}
                required
                className='sms-app-textarea'
              />
            </div>
          </div>

          <div className='sms-app-footer'>
            <button
              type='submit'
              className='sms-app-send-btn'
              disabled={isSubmitting || !message.trim()}
            >
              <Send size={18} />
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer à tous les parents'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SmsPage
