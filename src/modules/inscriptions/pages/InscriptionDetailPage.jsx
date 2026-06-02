import React, { useEffect, useState } from 'react'
import { ArrowLeft, GraduationCap, PencilLine, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import {
  deleteInscription,
  getInscription,
  updateInscriptionStatut,
} from '../../../services/inscriptionService'
import DetailField from '../components/DetailField'
import DetailSection from '../components/DetailSection'
import DetailSummaryCard from '../components/DetailSummaryCard'
import ModuleState from '../components/ModuleState'
import SelectField from '../components/SelectField'
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
import { INSCRIPTION_STATUS_OPTIONS } from '../utils/inscription'

const InscriptionDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [inscription, setInscription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [statut, setStatut] = useState('')
  const [statutError, setStatutError] = useState('')

  const loadInscription = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const payload = await getInscription(id)
      setInscription(unwrapEntity(payload, 'inscription'))
    } catch (error) {
      setLoadError(error.message || 'Impossible de charger cette inscription.')
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
      .catch((error) => {
        if (!isCancelled) {
          setLoadError(error.message || 'Impossible de charger cette inscription.')
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

  const handleStartEdit = () => {
    setStatut(inscription.statut || '')
    setStatutError('')
    setFeedback({ type: '', message: '' })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setStatut(inscription.statut || '')
    setStatutError('')
    setFeedback({ type: '', message: '' })
    setIsEditing(false)
  }

  const handleSaveStatut = async () => {
    setFeedback({ type: '', message: '' })

    if (!statut) {
      setStatutError('Selectionnez un statut.')
      return
    }

    setIsSaving(true)

    try {
      const payload = await updateInscriptionStatut(id, statut)
      const updatedInscription = unwrapEntity(payload, 'inscription')

      if (updatedInscription?.id) {
        setInscription(updatedInscription)
      } else {
        const refreshedPayload = await getInscription(id)
        setInscription(unwrapEntity(refreshedPayload, 'inscription'))
      }

      setIsEditing(false)
      setFeedback({ type: 'success', message: 'Statut modifie avec succes.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de modifier le statut.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    const isConfirmed = window.confirm(`Supprimer l inscription #${id} ? Cette action est irreversible.`)

    if (!isConfirmed) {
      return
    }

    setFeedback({ type: '', message: '' })
    setIsDeleting(true)

    try {
      await deleteInscription(id)
      navigate('/inscriptions', {
        replace: true,
        state: { successMessage: 'Inscription supprimee avec succes.' },
      })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de supprimer cette inscription.' })
    } finally {
      setIsDeleting(false)
    }
  }

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
          <p className='inscription-page-description'>Consultez cette inscription et mettez son statut a jour.</p>
        </div>
      </header>

      {location.state?.successMessage && <Feedback type='success' message={location.state.successMessage} />}

      {feedback.message && (
        <Feedback
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}

      {isLoading && <div className='inscription-loading'>Chargement de l inscription...</div>}

      {!isLoading && loadError && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={loadError}
          actionLabel='Reessayer'
          onAction={loadInscription}
        />
      )}

      {!isLoading && !loadError && inscription && (
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

          <DetailSection
            title='Informations de l inscription'
            actions={(
              isEditing
                ? (
                  <>
                    <Button type='button' variant='ghost' label='Annuler' disabled={isSaving} onClick={handleCancelEdit} className='inscription-action inscription-action--secondary' />
                    <Button type='button' variant='super' label={isSaving ? 'Enregistrement...' : 'Enregistrer'} loading={isSaving} onClick={handleSaveStatut} className='inscription-action inscription-action--primary' />
                  </>
                  )
                : (
                  <Button type='button' variant='ghost' label='Modifier le statut' icon={<PencilLine size={16} />} disabled={isDeleting} onClick={handleStartEdit} className='inscription-action inscription-action--secondary' />
                  )
            )}
          >
            <DetailField label='Reference' value={`#${inscription.id || id}`} />
            <DetailField label='Eleve' value={getStudentName(student)} />
            <DetailField label='Parent responsable' value={getParentName(parent)} />
            <DetailField label='Classe' value={getDesignation(classe, `Classe #${inscription.class_id || '-'}`)} />
            <DetailField label='Annee scolaire' value={getDesignation(anneeScolaire, `Annee #${inscription.annee_scolaire_id || '-'}`)} />
            {isEditing
              ? (
                <div className='inscription-detail-field inscription-detail-field--editing'>
                  <dt>Statut</dt>
                  <dd>
                    <SelectField
                      id='statut'
                      label=''
                      value={statut}
                      options={INSCRIPTION_STATUS_OPTIONS}
                      placeholder='Selectionner un statut'
                      error={statutError}
                      disabled={isSaving}
                      onChange={(event) => {
                        setStatut(event.target.value)
                        setStatutError('')
                      }}
                    />
                  </dd>
                </div>
                )
              : <DetailField label='Statut' value={inscription.statut?.replace(/_/g, ' ')} />}
          </DetailSection>

          <DetailSection
            title='Suivi de l inscription'
            actions={(
              <Button type='button' variant='ghost' label={isDeleting ? 'Suppression...' : 'Supprimer'} icon={<Trash2 size={16} />} loading={isDeleting} disabled={isEditing} onClick={handleDelete} className='inscription-action classe-delete-action' />
            )}
          >
            <DetailField label='Date de creation' value={formatDate(inscription.created_at)} />
            <DetailField label='Derniere modification' value={formatDate(inscription.updated_at)} />
          </DetailSection>
        </div>
      )}
    </section>
  )
}

export default InscriptionDetailPage
