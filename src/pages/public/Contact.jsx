import React, { useState } from 'react'
import { MapPin, Mail, PhoneCall } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Feedback from '../../components/ui/Feedback'
import '../../styles/public/Contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({ nom: '', email: '', sujet: '', message: '' })
  const [status, setStatus] = useState(null) // null, 'loading', 'success'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setStatus('loading')

    // Simulation d'envoi
    setTimeout(() => {
      setStatus('success')
      setFormData({ nom: '', email: '', sujet: '', message: '' })
    }, 1500)
  }

  return (
    <div className='contact-page'>
      <div className='contact-header'>
        <h1 className='section-title'>Contactez-nous</h1>
        <p className='contact-intro'>Une question sur GSEMMANUEL ? N'hésitez pas à nous écrire.</p>
      </div>

      <div className='contact-split-container'>
        
        {/* Left Side: Dark Theme with Abstract Decor */}
        <div className='contact-left'>
          <div className='contact-decor-circle-1' />
          <div className='contact-decor-circle-2' />
          
          <div className='contact-left-content'>
            <h2>Informations de contact</h2>
            <p className='contact-left-desc'>
              L'administration du Groupe Scolaire Emmanuel est à votre écoute pour toute demande d'assistance ou d'information.
            </p>
            
            <div className='contact-info-list'>
              <div className='contact-info-item'>
                <div className='contact-icon'><MapPin size={24} /></div>
                <div>
                  <h4>Notre Adresse</h4>
                  <p>Avenue des écoles, Goma<br />Nord-Kivu, RDC</p>
                </div>
              </div>
              
              <div className='contact-info-item'>
                <div className='contact-icon'><Mail size={24} /></div>
                <div>
                  <h4>Email</h4>
                  <p>contact@gsemmanuel.cd</p>
                </div>
              </div>

              <div className='contact-info-item'>
                <div className='contact-icon'><PhoneCall size={24} /></div>
                <div>
                  <h4>Téléphone</h4>
                  <p>+243 000 000 000</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Modern Form */}
        <div className='contact-right'>
          {status === 'success' && (
            <div style={{ marginBottom: '24px' }}>
              <Feedback
                type='success'
                title='Message envoyé'
                message='Votre message a été transmis avec succès. Nous vous répondrons très bientôt.'
                onClose={() => setStatus(null)}
              />
            </div>
          )}

          <form className='contact-form' onSubmit={handleSubmit}>
            <div className='form-row'>
              <div className='form-group'>
                <Input label='Nom complet' name='nom' placeholder='Jean Dupont' value={formData.nom} onChange={handleChange} required />
              </div>
              <div className='form-group'>
                <Input label='Adresse Email' type='email' name='email' placeholder='jean@exemple.com' value={formData.email} onChange={handleChange} required />
              </div>
            </div>
            
            <div className='form-group'>
              <Input label='Sujet' name='sujet' placeholder='Demande de renseignements' value={formData.sujet} onChange={handleChange} required />
            </div>
            
            <div className='form-group'>
              <label className='textarea-label'>Message</label>
              <textarea
                name='message'
                className='contact-textarea'
                placeholder='Comment pouvons-nous vous aider ?'
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
              />
            </div>
            
            <Button
              type='submit'
              variant='super'
              label='Envoyer le message'
              loading={status === 'loading'}
              className='submit-btn'
            />
          </form>
        </div>
      </div>
    </div>
  )
}

export default Contact
