import Loader from '../../../components/ui/Loader'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, GraduationCap, PencilLine, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import {
  deleteInscription,
  getInscription,
  getInscriptionSolde,
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
import { ADMIN_ROLES, normalizeRole } from '../../../utils/roles'
import {
  formatAmount,
  getInscriptionFinancialSummary,
  unwrapInscriptionSolde,
} from '../utils/amounts'
import { INSCRIPTION_STATUS_OPTIONS } from '../utils/inscription'

const InscriptionDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const context = useOutletContext()
  const canManageInscription = ADMIN_ROLES.includes(normalizeRole(context.sharedProfile?.role))
  const [inscription, setInscription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [solde, setSolde] = useState(() => location.state?.soldePreview || null)
  const [isLoadingSolde, setIsLoadingSolde] = useState(false)
  const [soldeError, setSoldeError] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [statut, setStatut] = useState('')
  const [statutError, setStatutError] = useState('')

  const loadInscription = async () => {
    setIsLoading(true)
    setIsLoadingSolde(true)
    setLoadError('')
    setSoldeError('')

    const [inscriptionResult, soldeResult] = await Promise.allSettled([
      getInscription(id),
      getInscriptionSolde(id),
    ])

    if (inscriptionResult.status === 'fulfilled') {
      setInscription(unwrapEntity(inscriptionResult.value, 'inscription'))
    } else {
      setLoadError(inscriptionResult.reason?.message || 'Impossible de charger cette inscription.')
    }

    if (soldeResult.status === 'fulfilled') {
      setSolde(unwrapInscriptionSolde(soldeResult.value))
    } else {
      setSoldeError(soldeResult.reason?.message || 'Impossible de charger le solde de cette inscription.')
    }

    setIsLoading(false)
    setIsLoadingSolde(false)
  }

  useEffect(() => {
    let isCancelled = false

    Promise.allSettled([
      getInscription(id),
      getInscriptionSolde(id),
    ]).then(([inscriptionResult, soldeResult]) => {
      if (isCancelled) {
        return
      }

      if (inscriptionResult.status === 'fulfilled') {
        setInscription(unwrapEntity(inscriptionResult.value, 'inscription'))
      } else {
        setLoadError(inscriptionResult.reason?.message || 'Impossible de charger cette inscription.')
      }

      if (soldeResult.status === 'fulfilled') {
        setSolde(unwrapInscriptionSolde(soldeResult.value))
      } else {
        setSoldeError(soldeResult.reason?.message || 'Impossible de charger le solde de cette inscription.')
      }

      setIsLoading(false)
      setIsLoadingSolde(false)
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
  const financialSummary = inscription ? getInscriptionFinancialSummary(inscription, solde) : null

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link
            to={canManageInscription ? '/inscriptions' : '/dashboard/profile'}
            className='inscription-back-link'
          >
            <ArrowLeft size={16} />
            {canManageInscription ? 'Retour aux inscriptions' : 'Retour au tableau de bord'}
          </Link>
          <p className='inscription-page-kicker'>Module inscription</p>
          <h1>Detail de l inscription #{id}</h1>
          <p className='inscription-page-description'>
            Consultez les informations de l inscription et son solde financier.
          </p>
        </div>
      </header>

      {location.state?.successMessage && <Feedback type='success' message={location.state.successMessage} />}
      {location.state?.warningMessage && <Feedback type='warning' message={location.state.warningMessage} />}

      {feedback.message && (
        <Feedback
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}

      {isLoading && <Loader message='Chargement de l inscription...' />}

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
              canManageInscription
                ? (
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
                  )
                : null
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

          <DetailSection title='Montants de l inscription'>
            {financialSummary?.detteReportee > 0 && (
              <div className='inscription-detail-field inscription-detail-field--wide inscription-debt-notice'>
                <dt>Dette reportee</dt>
                <dd>
                  Une ancienne dette de {formatAmount(financialSummary.detteReportee)} a ete ajoutee au total a payer.
                </dd>
              </div>
            )}

            {isLoadingSolde && <DetailField label='Solde' value='Chargement du solde...' />}

            {!isLoadingSolde && soldeError && (
              <div className='inscription-detail-field inscription-detail-field--wide inscription-solde-error'>
                <dt>Erreur solde</dt>
                <dd>{soldeError}</dd>
              </div>
            )}

            <DetailField label='Frais de l annee scolaire' value={formatAmount(financialSummary?.frais)} />
            <DetailField label='Dette reportee' value={formatAmount(financialSummary?.detteReportee)} />
            <DetailField label='Total a payer' value={formatAmount(financialSummary?.totalAPayer)} />
            <DetailField label='Montant paye' value={formatAmount(financialSummary?.montantPaye)} />
            <DetailField label='Reste a payer' value={formatAmount(financialSummary?.resteAPayer)} />
          </DetailSection>

          <DetailSection
            title='Suivi de l inscription'
            actions={(
              canManageInscription
                ? (
                  <Button type='button' variant='ghost' label={isDeleting ? 'Suppression...' : 'Supprimer'} icon={<Trash2 size={16} />} loading={isDeleting} disabled={isEditing} onClick={handleDelete} className='inscription-action classe-delete-action' />
                  )
                : null
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
