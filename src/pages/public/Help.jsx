import React from 'react'
import '../../styles/public/Help.css'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import HeroBanner from '../../assets/images/advice-for-student-banner.webp'

const faqData = [
  {
    id: 1,
    question: "Comment puis-je inscrire mon enfant pour l'année scolaire ?",
    answer: "L'inscription se fait au bureau de l'administration de GS Emmanuel. Les frais d'inscription doivent être payés sur place. Une fois enregistrées, les données de votre enfant seront intégrées dans l'application GSEMMANUEL."
  },
  {
    id: 2,
    question: 'Où puis-je consulter le solde des frais scolaires ?',
    answer: "En tant que parent, vous pouvez vous adresser à la comptabilité de l'école ou demander un reçu numérique pour vérifier le solde actuel de votre enfant."
  },
  {
    id: 3,
    question: 'Quels sont les modes de paiement acceptés ?',
    answer: "L'école accepte actuellement les paiements en espèces au niveau de la caisse. D'autres modes de paiement (mobile money) pourraient être intégrés ultérieurement."
  },
  {
    id: 4,
    question: 'Comment corriger une erreur sur un reçu ?',
    answer: 'Si vous constatez une erreur, veuillez vous présenter immédiatement au secrétariat de la direction avec votre preuve de paiement pour une régularisation.'
  }
]

const Help = () => {
  return (
    <main className='public-site-theme'>
      <Header />
      <div className='hero-banner'>
        <img src={HeroBanner} alt='hero banner' className='hero-banner-img' />
      </div>
      <div className='help-page'>

        <div className='faq-section'>
          <h1 className='section-title'>
            <span className='brush-bg-text'>AIDE (FAQ)</span>
          </h1>
          <div className='faq-list'>
            {faqData.map(item => (
              <div key={item.id} className='faq-item'>
                <h4>{item.question}</h4>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

export default Help
