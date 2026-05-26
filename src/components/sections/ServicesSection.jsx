import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Wallet, BarChart3, Bell } from 'lucide-react'
import FeatureCard from '../../components/ui/FeatureCard'
import Button from '../../components/ui/Button'
import '../../styles/public/ServicesSection.css'

const servicesData = [
  {
    id: 1,
    title: 'Suivi des paiements',
    description: 'Suivez facilement les paiements des élèves et consultez l\'état des frais en temps réel.',
    image: 'https://t4.ftcdn.net/jpg/05/15/22/27/360_F_515222757_8D6g42WvLcwBW8DLozTPBJDQ2CDacCjt.jpg',
    icon: <CreditCard size={22} />
  },
  {
    id: 2,
    title: 'Gestion des frais scolaires',
    description: 'Organisez les frais, les échéances et les soldes de chaque élève depuis un espace centralisé.',
    image: 'https://st2.depositphotos.com/2444809/5617/v/450/depositphotos_56170605-stock-illustration-cover-annual-report.jpg',
    icon: <Wallet size={22} />
  },
  {
    id: 3,
    title: 'Transparence financière',
    description: "Donnez à l'administration une vision claire et fiable des entrées financières de l'école.",
    image: 'https://img.freepik.com/vecteurs-libre/conception-brochure-du-rapport-annuel-entreprise_1017-59689.jpg?semt=ais_hybrid&w=740&q=80',
    icon: <BarChart3 size={22} />
  },
  {
    id: 4,
    title: 'Notifications et rappels',
    description: 'Informez rapidement les parents sur les paiements, les soldes et les échéances importantes.',
    image: 'https://i.ibb.co/n83CK5NC/23997850-6894423.jpg',
    icon: <Bell size={22} />
  }
]

const ServicesSection = () => {
  const navigate = useNavigate()

  return (
    <section className='services-section'>
      <h2 className='section-title'>Nos services</h2>
      <p className='services-section__subtitle'>
        Tout ce dont votre école a besoin pour une gestion financière moderne et fiable.
      </p>

      <div className='services-section__grid'>
        {servicesData.map((service) => (
          <FeatureCard
            key={service.id}
            title={service.title}
            description={service.description}
            image={service.image}
            icon={service.icon}
          />
        ))}
      </div>

      <div className='services-section__cta'>
        <Button variant='outline' label='Voir tous les services' onClick={() => navigate('/services')} />
      </div>
    </section>
  )
}

export default ServicesSection
