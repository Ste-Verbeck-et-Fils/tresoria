import React, { useState, useEffect, useRef } from 'react'
import { CreditCard, WifiOff, Wallet, FileText } from 'lucide-react'
import FeatureCard from '../../components/ui/FeatureCard'
import '../../styles/public/ProblemWheel.css'

const problems = [
  {
    title: 'Paiements difficiles à suivre',
    description: 'Les paiements des élèves peuvent vite devenir confus lorsqu\'ils sont enregistrés manuellement.',
    image: 'https://img.freepik.com/vecteurs-libre/conception-brochure-du-rapport-annuel-entreprise_1017-59689.jpg?semt=ais_hybrid&w=740&q=80',
    icon: <CreditCard size={20} />
  },
  {
    title: 'Frais scolaires mal organisés',
    description: 'Les frais, échéances et soldes doivent être centralisés pour éviter les oublis et les erreurs.',
    image: 'https://i.ibb.co/tpScw7Zw/31643809-2205-i402-024-F-m004-c9-Workplace-safety-background.jpg',
    icon: <Wallet size={20} />
  },
  {
    title: 'Manque de transparence',
    description: "L'administration et les parents ont besoin d'une vision claire sur les paiements effectués.",
    image: 'https://t4.ftcdn.net/jpg/05/15/22/27/360_F_515222757_8D6g42WvLcwBW8DLozTPBJDQ2CDacCjt.jpg',
    icon: <WifiOff size={20} />
  },
  {
    title: 'Rapports financiers lents',
    description: 'Les rapports de caisse doivent être rapides, lisibles et faciles à exploiter.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyDJxqrEQtkGc496Z2T8KhngS_jR0L-2HNsA&s',
    icon: <FileText size={20} />
  }
]

const duplicatedProblems = [...problems, ...problems, ...problems]

const ProblemWheelSection = () => {
  const count = duplicatedProblems.length
  const [isPaused, setIsPaused] = useState(false)
  const timeoutRef = useRef(null)

  const handleCardClick = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsPaused(true)
    timeoutRef.current = setTimeout(() => {
      setIsPaused(false)
    }, 6000) // 6 seconds pause
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <section className='wheel-section' style={{ '--play-state': isPaused ? 'paused' : 'running' }}>
      <h2 className='section-title'>Les défis de la gestion scolaire</h2>
      <p className='wheel-subtitle'>Des problèmes courants que GSEMMANUEL résout au quotidien.</p>

      <div className='wheel-viewport'>
        <div className='wheel-ring'>
          <div className='wheel-dashed-border' />

          {duplicatedProblems.map((item, idx) => {
            const angleDeg = (360 / count) * idx
            return (
              <div
                key={idx}
                className='wheel-slot'
                style={{ '--slot-angle': `${angleDeg}deg`, '--slot-angle-reverse': `${-angleDeg}deg` }}
              >
                <div className='wheel-card-wrapper'>
                  <div className='wheel-card-inner' onClick={handleCardClick} role='button' tabIndex={0}>
                    <FeatureCard
                      title={item.title}
                      description={item.description}
                      image={item.image}
                      icon={item.icon}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className='wheel-mask wheel-mask--left' />
        <div className='wheel-mask wheel-mask--right' />
      </div>
    </section>
  )
}

export default ProblemWheelSection
