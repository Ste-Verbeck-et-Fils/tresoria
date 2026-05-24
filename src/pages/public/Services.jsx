import React from 'react'
import { CreditCard, Users, FileText, BarChart3, ShieldCheck, History } from 'lucide-react'
import FeatureCard from '../../components/ui/FeatureCard'
import '../../styles/public/Services.css'

const servicesData = [
  {
    id: 1,
    title: 'Gestion des paiements',
    description: 'Enregistrez les versements des frais scolaires de manière numérique et générez des reçus automatiquement.',
    image: 'https://i.ibb.co/7J6xcSj2/17346099-2009-i518-001-crowdfunding-set-07.jpg',
    icon: <CreditCard size={22} />
  },
  {
    id: 2,
    title: 'Suivi par élève',
    description: "Visualisez le solde et l'historique des paiements pour chaque élève individuellement.",
    image: 'https://i.ibb.co/n83CK5NC/23997850-6894423.jpg',
    icon: <Users size={22} />
  },
  {
    id: 3,
    title: 'Rapports financiers',
    description: "Éditez des rapports complets sur les entrées et sorties d'argent pour une comptabilité saine.",
    image: 'https://i.ibb.co/TqTYDWYm/18611445-Sandy-Bus-06-Single-11.jpg',
    icon: <BarChart3 size={22} />
  },
  {
    id: 4,
    title: 'Historique des transactions',
    description: "Retrouvez facilement n'importe quelle transaction grâce à un historique détaillé et filtrable.",
    image: 'https://i.ibb.co/tpScw7Zw/31643809-2205-i402-024-F-m004-c9-Workplace-safety-background.jpg',
    icon: <History size={22} />
  },
  {
    id: 5,
    title: 'Transparence totale',
    description: 'Un système conçu pour éviter les erreurs de caisse et fournir des données fiables à la direction.',
    image: 'https://i.ibb.co/7J6xcSj2/17346099-2009-i518-001-crowdfunding-set-07.jpg',
    icon: <FileText size={22} />
  },
  {
    id: 6,
    title: 'Sécurité & Authentification',
    description: "L'accès aux données financières est strictement protégé et réservé au personnel autorisé.",
    image: 'https://i.ibb.co/TqTYDWYm/18611445-Sandy-Bus-06-Single-11.jpg',
    icon: <ShieldCheck size={22} />
  }
]

const Services = () => {
  return (
    <div className='services-page'>
      <div className='services-header'>
        <h1 className='section-title'>Nos Services</h1>
        <p className='services-intro'>Découvrez comment GSEMMANUEL modernise la gestion de votre école.</p>
      </div>

      <div className='services-grid'>
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
    </div>
  )
}

export default Services
