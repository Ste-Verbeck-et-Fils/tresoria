import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Mail, PhoneCall } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Feedback from '../../components/ui/Feedback'
import '../../styles/public/Contact.css'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import HeroBanner from '../../assets/images/advice-for-student-banner.webp'

const Contact = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ nom: '', email: '', sujet: '', message: '' })
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setStatus(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setStatus('loading')

    setTimeout(() => {
      setStatus('success')
      setFormData({ nom: '', email: '', sujet: '', message: '' })
    }, 1500)
  }

  return (
    <div className='public-site-theme'>
      <Header onActionClick={() => navigate('/login')} />
      <div className="hero-banner">
        <img src={HeroBanner} alt="hero banner" className='hero-banner-img' />
      </div>
      <div className='contact-page'>
        <div className='contact-header'>
          <h1 className='section-title'>
            <span className='brush-bg-text'>CONTACT</span>
          </h1>
        </div>

        <div className='contact-split-container'>

          {/* Left Side: Information */}
          <div className='contact-left'>
            <div className='contact-left-content'>

              <p className='contact-left-desc'>
                L'administration du Gs Emmanuel est à votre écoute pour toute demande d'assistance ou d'information.
              </p>

              <div className='contact-info-list'>
                <div className='contact-info-item'>
                  <div className='contact-icon'><MapPin size={24} /></div>
                  <div className='contact-info-item-text'>
                    <h4>Notre Adresse</h4>
                    <p>Avenue des écoles, Goma<br />Nord-Kivu, RDC</p>
                  </div>
                </div>

                <div className='contact-info-item'>
                  <div className='contact-icon'><Mail size={24} /></div>
                  <div className='contact-info-item-text'>
                    <h4>Email</h4>
                    <p>contact@gsemmanuel.com</p>
                  </div>
                </div>

                <div className='contact-info-item'>
                  <div className='contact-icon'><PhoneCall size={24} /></div>
                  <div className='contact-info-item-text'>
                    <h4>Téléphone</h4>
                    <p>+243 814 717 237</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Modern Form */}
          <div className='contact-right'>
            {status === 'success' && (
              <div className='contact-feedback-wrapper'>
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
                  <Input label='Nom complet' name='nom' placeholder='Entrez votre nom' value={formData.nom} onChange={handleChange} required />
                </div>
                <div className='form-group'>
                  <Input label='Adresse Email' type='email' name='email' placeholder='Entrez votre email' value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div className='form-group'>
                <Input label='Sujet' name='sujet' placeholder="Entrez l'objet de votre message" value={formData.sujet} onChange={handleChange} required />
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
      <Footer />
    </div>
  )
}

export default Contact
