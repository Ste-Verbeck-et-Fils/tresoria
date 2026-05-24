import React from 'react'
import { Target, Map, TrendingUp, Clock, ShieldCheck, CheckCircle } from 'lucide-react'
import '../../styles/public/About.css'

const About = () => {
    return (
        <div className='about-page'>
            <div className='about-header-wrapper'>
                <div className='about-header-glow' />
                <section className='about-header'>
                    <h2 className='section-title'>
                        À propos de <br />
                        <span className='handwritten-title'>
                            <span className='handwritten-highlight'>GS Emmanuel</span>
                        </span>
                    </h2>
                    <p className='about-intro'>
                        Une vision claire pour moderniser la gestion scolaire et garantir un avenir serein au cœur de Goma.
                    </p>
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
                            L'application <strong>GSEMMANUEL</strong> a été conçue pour répondre à un besoin crucial : simplifier et sécuriser la gestion de la trésorerie au sein du Groupe Scolaire Emmanuel. Nous avons pour mission d'éliminer les erreurs manuelles, de centraliser les paiements des élèves et de garantir une comptabilité absolument irréprochable au quotidien.
                        </p>
                    </div>
                </div>

                <div className='bento-card bento-card--tall'>
                    <Map size={120} strokeWidth={1} className='bento-icon-bg' />
                    <div className='bento-card-content'>
                        <div className='bento-icon-wrapper' style={{ color: 'var(--color-warning)' }}>
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
                        <div className='bento-icon-wrapper' style={{ color: 'var(--color-info)' }}>
                            <Clock size={24} />
                        </div>
                        <h3>Gain de temps</h3>
                        <p>Automatisation complète pour le personnel administratif.</p>
                    </div>
                </div>

                <div className='bento-card bento-card--small'>
                    <TrendingUp size={80} strokeWidth={1} className='bento-icon-bg' />
                    <div className='bento-card-content'>
                        <div className='bento-icon-wrapper' style={{ color: 'var(--color-success)' }}>
                            <TrendingUp size={24} />
                        </div>
                        <h3>Transparence</h3>
                        <p>Une visibilité totale pour les parents et la direction.</p>
                    </div>
                </div>


            </section>
        </div>
    )
}

export default About
