import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import ProblemWheelSection from '../../components/sections/ProblemWheelSection'
import ServicesSection from '../../components/sections/ServicesSection'
import '../../styles/public/Home.css'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'

const Home = () => {
  const navigate = useNavigate()

  return (
    <><Header />
      <div className='home-page'>
        <section className='hero-section'>
          <h1 className='hero-title'>
            <span id='titre-gs'>GS Emmanuel</span>
          </h1>
          <p className='hero-subtitle'>
            Une application de gestion moderne et inteligible de la tresorerie scolaire à Goma, en toute transparence et sécurité.
          </p>
          <div className='hero-actions'>
            <Button variant='super' label='Accéder au tableau de bord' onClick={() => navigate('/login')} />
            <Button variant='outline' label='Découvrir nos services' onClick={() => navigate('/services')} />
          </div>
        </section>

        <ProblemWheelSection />

        <ServicesSection />
      </div>
      <Footer />
    </>
  )
}

export default Home
