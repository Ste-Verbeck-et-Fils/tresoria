import React, { useEffect, useState } from 'react'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import Feedback from '../../../components/ui/Feedback'
import { getInscription } from '../../../services/inscriptionService'
import DetailField from '../components/DetailField'
import DetailSection from '../components/DetailSection'
import DetailSummaryCard from '../components/DetailSummaryCard'
import ModuleState from '../components/ModuleState'
import StatusBadge from '../components/StatusBadge'
import {
  formatDate,
  getDesignation,
  getInscriptionAnnee,
  getInscriptionClasse,
  getInscriptionParent,
  getInscriptionStudent,
  getParentName,
  getStudentName,
  unwrapEntity,
} from '../utils/data'

const InscriptionDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const [inscription, setInscription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadInscription = async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await getInscription(id)
      setInscription(unwrapEntity(payload, 'inscription'))
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger cette inscription.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    getInscription(id)
      .then((payload) => {
        if (!isCancelled) {
          setInscription(unwrapEntity(payload, 'inscription'))
        }
      })
      .catch((loadError) => {
        if (!isCancelled) {
          setError(loadError.message || 'Impossible de charger cette inscription.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [id])

  const student = inscription ? getInscriptionStudent(inscription) : null
  const classe = inscription ? getInscriptionClasse(inscription) : null
  const parent = inscription ? getInscriptionParent(inscription) : null
  const anneeScolaire = inscription ? getInscriptionAnnee(inscription) : null

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/inscriptions' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux inscriptions
          </Link>
          <p className='inscription-page-kicker'>Module inscription</p>
          <h1>Detail de l inscription #{id}</h1>
          <p className='inscription-page-description'>Retrouvez les informations principales de cette inscription.</p>
        </div>
      </header>

      {location.state?.successMessage && (
        <Feedback type='success' message={location.state.successMessage} />
      )}

      {isLoading && <div className='inscription-loading'>Chargement de l inscription...</div>}

      {!isLoading && error && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={error}
          actionLabel='Reessayer'
          onAction={loadInscription}
        />
      )}

      {!isLoading && !error && inscription && (
        <div className='detail-page-stack'>
          <DetailSummaryCard
            icon={<GraduationCap size={36} aria-hidden='true' />}
            title={getStudentName(student)}
            subtitle={`Inscription #${inscription.id || id}`}
            meta={[
              getDesignation(classe, `Classe #${inscription.class_id || '-'}`),
              getDesignation(anneeScolaire, `Annee #${inscription.annee_scolaire_id || '-'}`),
            ].join(' - ')}
            badge={<StatusBadge value={inscription.statut} />}
          />

          <DetailSection title='Informations de l inscription'>
            <DetailField label='Reference' value={`#${inscription.id || id}`} />
            <DetailField label='Eleve' value={getStudentName(student)} />
            <DetailField label='Parent responsable' value={getParentName(parent)} />
            <DetailField
              label='Classe'
              value={getDesignation(classe, `Classe #${inscription.class_id || '-'}`)}
            />
            <DetailField
              label='Annee scolaire'
              value={getDesignation(anneeScolaire, `Annee #${inscription.annee_scolaire_id || '-'}`)}
            />
            <DetailField label='Statut' value={inscription.statut?.replace(/_/g, ' ')} />
          </DetailSection>

          <DetailSection title='Suivi de l inscription'>
            <DetailField label='Date de creation' value={formatDate(inscription.created_at)} />
            <DetailField label='Derniere modification' value={formatDate(inscription.updated_at)} />
          </DetailSection>
        </div>
      )}
    </section>
  )
}

export default InscriptionDetailPage
