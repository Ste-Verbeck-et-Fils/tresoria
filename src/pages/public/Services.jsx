import React from 'react'
import { CreditCard, Users, FileText, BarChart3, ShieldCheck, History } from 'lucide-react'
import FeatureCard from '../../components/ui/FeatureCard'
import '../../styles/public/Services.css'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import HeroBanner from '../../assets/images/advice-for-student-banner.webp'

const servicesData = [
  {
    id: 1,
    title: 'Gestion des paiements',
    description: 'Enregistrez les versements des frais scolaires de manière numérique et générez des reçus automatiquement.',
    image: 'https://t4.ftcdn.net/jpg/05/15/22/27/360_F_515222757_8D6g42WvLcwBW8DLozTPBJDQ2CDacCjt.jpg',
    icon: <CreditCard size={22} />
  },
  {
    id: 2,
    title: 'Suivi par élève',
    description: "Visualisez le solde et l'historique des paiements pour chaque élève individuellement.",
    image: 'https://st2.depositphotos.com/2444809/5617/v/450/depositphotos_56170605-stock-illustration-cover-annual-report.jpg',
    icon: <Users size={22} />
  },
  {
    id: 3,
    title: 'Rapports financiers',
    description: "Éditez des rapports complets sur les entrées et sorties d'argent pour une comptabilité saine.",
    image: 'https://img.freepik.com/vecteurs-libre/conception-brochure-du-rapport-annuel-entreprise_1017-59689.jpg?semt=ais_hybrid&w=740&q=80',
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
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyDJxqrEQtkGc496Z2T8KhngS_jR0L-2HNsA&s',
    icon: <FileText size={22} />
  },
  {
    id: 6,
    title: 'Sécurité & Authentification',
    description: "L'accès aux données financières est strictement protégé et réservé au personnel autorisé.",
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQO4HEiz_ptaEOPFZasrtwl6JRAxNHSQPNiZA&s',
    icon: <ShieldCheck size={22} />
  }
]

const Services = () => {
  return (
    <div className='public-site-theme'>
      <Header />
      <div className="hero-banner">
        <img src={HeroBanner} alt="hero banner" className='hero-banner-img' />
      </div>
      <div className='services-page'>
        <div className='services-header'>
          <h1 className='section-title'>
            <span className='brush-bg-text'>SERVICES</span>
          </h1>
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
      <Footer />
    </div>
  )
}

export default Services
