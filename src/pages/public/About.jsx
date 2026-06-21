import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Map, TrendingUp, Clock } from 'lucide-react'
import '../../styles/public/About.css'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'

import photoHope from '../../assets/images/photo_hope.jpeg'
import photoNaomie from '../../assets/images/photo_naomie.jpeg'
import photoVerbeck from '../../assets/images/photo_verbeck.jpeg'
import photoGrace from '../../assets/images/photo_grace.jpeg'
import photoJemimah from '../../assets/images/photo_jemimah.jpeg'
import HeroBanner from '../../assets/images/advice-for-student-banner.webp'

const About = () => {
  const navigate = useNavigate()
  const developpeurs = [
    { id: 1, name: 'HOPE NDAKOLA', desc: 'Gestionnaire', image: photoHope },
    { id: 2, name: 'NAOMIE ASIANGAME', desc: 'Marketing', image: photoNaomie },
    { id: 3, name: 'JEAN-MARC VERBECK', desc: 'Web Developer, IT', image: photoVerbeck },
    { id: 4, name: 'GRACE MAHAMBA', desc: 'IT, Web developer', image: photoGrace },
    { id: 5, name: 'JAMIMAH SERUTI', desc: 'Communication & Marketing', image: photoJemimah }
  ]
  return (

    <div className='public-site-theme'>
      <Header onActionClick={() => navigate('/login')} />
      <div className='hero-banner'>
        <img src={HeroBanner} alt='hero banner' className='hero-banner-img' />
      </div>
      <div className='about-page'>
        <div className='about-header-wrapper'>
          <div className='about-header-glow' />
          <section className='about-header'>
            <h1 className='section-title'>
              <span className='brush-bg-text'>A PROPOS</span>
            </h1>
          </section>
        </div>

        <section className='bento-grid'>
          <div className='bento-card bento-card--large bento-card--primary'>
            <Target size={120} strokeWidth={1} className='bento-icon-bg' />
            <div className='bento-card-content'>
              <div className='bento-icon-wrapper'>
                <Target size={28} />
              </div>
              <h2>Notre Objectif Principal</h2>
              <p>
                L'application <strong>GSEMMANUEL</strong> a été conçue pour répondre à un besoin crucial : simplifier et sécuriser la gestion de la trésorerie au sein du Groupe Scolaire Emmanuel. Nous avons pour mission d'éliminer les erreurs manuelles, de centraliser les entrées des élèves et de garantir une comptabilité absolument irréprochable au quotidien.
              </p>
            </div>
          </div>

          <div className='bento-card bento-card--tall'>
            <Map size={120} strokeWidth={1} className='bento-icon-bg' />
            <div className='bento-card-content'>
              <div className='bento-icon-wrapper bento-icon-wrapper--warning'>
                <Map size={28} />
              </div>
              <h2>Le Contexte</h2>
              <p>
                Située au cœur de Goma (RDC), notre école accueille de nombreux élèves. La gestion des frais scolaires nécessite une organisation numérique rigoureuse pour garder une vue d'ensemble instantanée.
              </p>
            </div>
          </div>

          <div className='bento-card bento-card--small'>
            <Clock size={80} strokeWidth={1} className='bento-icon-bg' />
            <div className='bento-card-content'>
              <div className='bento-icon-wrapper bento-icon-wrapper--info'>
                <Clock size={24} />
              </div>
              <h3>Gain de temps</h3>
              <p>Automatisation complète pour le personnel administratif.</p>
            </div>
          </div>

          <div className='bento-card bento-card--small'>
            <TrendingUp size={80} strokeWidth={1} className='bento-icon-bg' />
            <div className='bento-card-content'>
              <div className='bento-icon-wrapper bento-icon-wrapper--success'>
                <TrendingUp size={24} />
              </div>
              <h3>Transparence</h3>
              <p>Une visibilité totale pour les parents et la direction.</p>
            </div>
          </div>

        </section>

        <section className='team-section'>
          <h2>L'équipe de développement</h2>
          <div className='team-avatars'>
            {developpeurs.map(dev => (
              <div key={dev.id} className='avatar-circle'>
                <img src={dev.image} alt={dev.name} />
                <div className='avatar-tooltip'>
                  <div className='avatar-tooltip-name'>{dev.name}</div>
                  <div className='avatar-tooltip-desc'>{dev.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  )
}

export default About
