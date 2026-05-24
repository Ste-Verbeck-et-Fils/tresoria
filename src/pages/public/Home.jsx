import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import ProblemWheelSection from '../../components/sections/ProblemWheelSection'
import ServicesSection from '../../components/sections/ServicesSection'
import '../../styles/public/Home.css'

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className='home-page'>
      <section className='hero-section'>
        <h1 className='hero-title'>
          Gérez la trésorerie de <br />
          <span className='handwritten-title'><span className='handwritten-highlight'>GS Emmanuel</span></span>
          <br />en toute simplicité
        </h1>
        <p className='hero-subtitle'>
          L'application de gestion moderne, transparente et sécurisée pour le suivi des frais scolaires à Goma.
        </p>
        <div className='hero-actions'>
          <Button variant='super' label='Accéder au tableau de bord' onClick={() => navigate('/login')} />
          <Button variant='outline' label='Découvrir nos services' onClick={() => navigate('/services')} />
        </div>
      </section>

      <ProblemWheelSection />

      <ServicesSection />
    </div>
  )
}

export default Home
