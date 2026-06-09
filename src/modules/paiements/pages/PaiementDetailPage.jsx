import Loader from '../../../components/ui/Loader'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Ban, CreditCard, PencilLine, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import {
  getInscription,
  getInscriptionSolde,
} from '../../../services/inscriptionService'
import {
  annulerPaiement,
  deletePaiement,
  getPaiement,
  updatePaiement,
} from '../../../services/paiementService'
import DetailField from '../../inscriptions/components/DetailField'
import DetailSection from '../../inscriptions/components/DetailSection'
import DetailSummaryCard from '../../inscriptions/components/DetailSummaryCard'
import ModuleState from '../../inscriptions/components/ModuleState'
import SelectField from '../../inscriptions/components/SelectField'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import {
  formatDate,
  getDesignation,
  getInscriptionAnnee,
  getInscriptionClasse,
  getInscriptionStudent,
  getStudentName,
  unwrapEntity,
} from '../../inscriptions/utils/data'
import {
  formatAmount,
  getInscriptionFinancialSummary,
  unwrapInscriptionSolde,
} from '../../inscriptions/utils/amounts'
import {

  getInscriptionOptionLabel,
  getPaiementDate,
  getPaiementInscription,
  getPaiementModeLabel,
  getPaiementMontant,
  getPaiementMotifLabel,
  getPaiementPayload,
  getPaiementStatus,
  isAnneeScolaireCloturee,
  MODE_PAIEMENT_OPTIONS,
  MOTIF_PAIEMENT_OPTIONS,
  normalizePaiementForm,
  unwrapPaiement,
  validatePaiementForm,
} from '../utils/paiement'

const resolvePaiementBundle = async (id) => {
  const paiementPayload = await getPaiement(id)
  const paiement = unwrapPaiement(paiementPayload)
  const attachedInscription = getPaiementInscription(paiement)
  const inscriptionId = attachedInscription?.id || paiement?.inscription_id
  let inscription = attachedInscription || null
  let solde = null
  let soldeError = ''

  if (!inscription && inscriptionId) {
    const inscriptionPayload = await getInscription(inscriptionId)
    inscription = unwrapEntity(inscriptionPayload, 'inscription')
  }

  if (inscriptionId) {
    try {
      const soldePayload = await getInscriptionSolde(inscriptionId)
      solde = unwrapInscriptionSolde(soldePayload)
    } catch (error) {
      soldeError = error.message || 'Impossible de charger le solde de cette inscription.'
    }
  } else {
    soldeError = 'Ce paiement ne contient pas d inscription rattachee.'
  }

  return { paiement, inscription, solde, soldeError }
}

const PaiementDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [paiement, setPaiement] = useState(null)
  const [inscription, setInscription] = useState(null)
  const [solde, setSolde] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [soldeError, setSoldeError] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(normalizePaiementForm())
  const [editErrors, setEditErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadPaiementData = async () => {
    setIsLoading(true)
    setLoadError('')
    setSoldeError('')

    try {
      const bundle = await resolvePaiementBundle(id)

      setPaiement(bundle.paiement)
      setInscription(bundle.inscription)
      setSolde(bundle.solde)
      setSoldeError(bundle.soldeError)
    } catch (error) {
      setLoadError(error.message || 'Impossible de charger cette entrée.')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAfterMutation = async (successMessage) => {
    const bundle = await resolvePaiementBundle(id)

    setPaiement(bundle.paiement)
    setInscription(bundle.inscription)
    setSolde(bundle.solde)
    setSoldeError(bundle.soldeError)
    setFeedback({ type: 'success', message: successMessage })
  }

  useEffect(() => {
    let isCancelled = false

    resolvePaiementBundle(id)
      .then((bundle) => {
        if (!isCancelled) {
          setPaiement(bundle.paiement)
          setInscription(bundle.inscription)
          setSolde(bundle.solde)
          setSoldeError(bundle.soldeError)
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setLoadError(error.message || 'Impossible de charger cette entrée.')
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
    setEditForm(normalizePaiementForm({
      ...paiement,
      inscription_id: inscription?.id || paiement?.inscription_id || '',
    }))
    setEditErrors({})
    setFeedback({ type: '', message: '' })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditForm(normalizePaiementForm({
      ...paiement,
      inscription_id: inscription?.id || paiement?.inscription_id || '',
    }))
    setEditErrors({})
    setFeedback({ type: '', message: '' })
    setIsEditing(false)
  }

  const handleEditChange = (event) => {
    const { id: fieldId, value } = event.target
    setEditForm((currentForm) => ({ ...currentForm, [fieldId]: value }))

    if (editErrors[fieldId]) {
      setEditErrors((currentErrors) => ({ ...currentErrors, [fieldId]: '' }))
    }
  }

  const handleSaveEdit = async () => {
    setFeedback({ type: '', message: '' })

    const nextErrors = validatePaiementForm(editForm, inscription)
    setEditErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)

    try {
      await updatePaiement(id, getPaiementPayload(editForm))
      setIsEditing(false)
      await refreshAfterMutation('Entrée modifiée avec succes.')
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de modifier cette entrée.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAnnuler = async () => {
    const isConfirmed = window.confirm(`Annuler l'entrée #${id} ?`)

    if (!isConfirmed) {
      return
    }

    setFeedback({ type: '', message: '' })
    setIsCancelling(true)

    try {
      await annulerPaiement(id)
      await refreshAfterMutation('Entrée annulée avec succes.')
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible d annuler cette entrée.' })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDelete = async () => {
    const isConfirmed = window.confirm(`Supprimer l'entrée #${id} ? Cette action est irreversible.`)

    if (!isConfirmed) {
      return
    }

    setFeedback({ type: '', message: '' })
    setIsDeleting(true)

    try {
      await deletePaiement(id)
      navigate('/paiements', {
        replace: true,
        state: { successMessage: 'Entrée supprimée avec succes.' },
      })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de supprimer cette entrée.' })
    } finally {
      setIsDeleting(false)
    }
  }

  const student = inscription ? getInscriptionStudent(inscription) : null
  const classe = inscription ? getInscriptionClasse(inscription) : null
  const anneeScolaire = inscription ? getInscriptionAnnee(inscription) : null
  const isInscriptionClosed = inscription ? isAnneeScolaireCloturee(inscription) : false
  const financialSummary = inscription ? getInscriptionFinancialSummary(inscription, solde) : null
  const status = paiement ? getPaiementStatus(paiement) : ''
  const isActionPending = isSaving || isCancelling || isDeleting

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/paiements' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux entrées
          </Link>
          <h1>Detail de l'entrée #{id}</h1>

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

      {isLoading && <Loader message='Chargement de l entrée...' />}

      {!isLoading && loadError && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={loadError}
          actionLabel='Reessayer'
          onAction={loadPaiementData}
        />
      )}

      {!isLoading && !loadError && paiement && (
        <div className='detail-page-stack'>
          <DetailSummaryCard
            icon={<CreditCard size={36} aria-hidden='true' />}
            title={`Entrée #${paiement.id || id}`}
            subtitle={formatAmount(getPaiementMontant(paiement))}
            meta={inscription ? getInscriptionOptionLabel(inscription) : '-'}
            badge={<StatusBadge value={status} />}
          />

          {isInscriptionClosed && (
            <Feedback
              type='warning'
              message='L annee scolaire de cette inscription est cloturee : aucun nouveau paiement ne peut etre effectue dessus.'
            />
          )}

          <DetailSection
            title='Informations de l entrée'
            actions={(
              isEditing
                ? (
                  <>
                    <Button
                      type='button'
                      variant='ghost'
                      label='Annuler'
                      disabled={isSaving}
                      onClick={handleCancelEdit}
                      className='inscription-action inscription-action--secondary'
                    />
                    <Button
                      type='button'
                      variant='super'
                      label={isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      loading={isSaving}
                      disabled={isInscriptionClosed}
                      onClick={handleSaveEdit}
                      className='inscription-action inscription-action--primary'
                    />
                  </>
                  )
                : (
                  <Button
                    type='button'
                    variant='ghost'
                    label='Modifier'
                    icon={<PencilLine size={16} />}
                    disabled={isActionPending || isInscriptionClosed}
                    onClick={handleStartEdit}
                    className='inscription-action inscription-action--secondary'
                  />
                  )
            )}
          >
            <DetailField label='Reference' value={`#${paiement.id || id}`} />
            <DetailField label='Inscription' value={inscription ? `#${inscription.id}` : `#${paiement.inscription_id || '-'}`} />
            {isEditing
              ? (
                <>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Montant</dt>
                    <dd>
                      <Input
                        id='montant'
                        type='number'
                        min='1'
                        value={editForm.montant}
                        error={editErrors.montant}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Motif</dt>
                    <dd>
                      <SelectField
                        id='motif'
                        label=''
                        value={editForm.motif}
                        options={MOTIF_PAIEMENT_OPTIONS}
                        placeholder='Selectionner un motif'
                        error={editErrors.motif}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Mode</dt>
                    <dd>
                      <SelectField
                        id='mode_paiement'
                        label=''
                        value={editForm.mode_paiement}
                        options={MODE_PAIEMENT_OPTIONS}
                        placeholder='Selectionner un mode'
                        error={editErrors.mode_paiement}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Reference externe</dt>
                    <dd>
                      <Input
                        id='reference'
                        type='text'
                        value={editForm.reference}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                </>
                )
              : (
                <>
                  <DetailField label='Montant' value={formatAmount(getPaiementMontant(paiement))} />
                  <DetailField label='Motif' value={getPaiementMotifLabel(paiement.motif || paiement.type)} />
                  <DetailField label='Mode' value={getPaiementModeLabel(paiement.mode_paiement || paiement.modePaiement || paiement.mode)} />
                  <DetailField label='Reference externe' value={paiement.reference || paiement.transaction_reference} />
                </>
                )}
            <DetailField label='Statut' value={<StatusBadge value={status} />} />
            <DetailField label='Date de l entrée' value={formatDate(getPaiementDate(paiement))} />
          </DetailSection>

          <DetailSection title='Inscription concernee'>
            <DetailField label='Eleve' value={getStudentName(student)} />
            <DetailField label='Classe' value={getDesignation(classe, `Classe #${inscription?.class_id || '-'}`)} />
            <DetailField label='Annee scolaire' value={getDesignation(anneeScolaire, `Annee #${inscription?.annee_scolaire_id || '-'}`)} />
            <DetailField label='Statut annee scolaire' value={<StatusBadge value={anneeScolaire?.statut} />} />
          </DetailSection>

          <DetailSection title='Solde de l inscription'>
            {soldeError && (
              <div className='inscription-detail-field inscription-detail-field--wide inscription-solde-error'>
                <dt>Erreur solde</dt>
                <dd>{soldeError}</dd>
              </div>
            )}

            {financialSummary?.detteReportee > 0 && (
              <div className='inscription-detail-field inscription-detail-field--wide inscription-debt-notice'>
                <dt>Dette reportee</dt>
                <dd>
                  Une ancienne dette de {formatAmount(financialSummary.detteReportee)} est incluse dans le total a payer.
                </dd>
              </div>
            )}

            <DetailField label='Frais de l annee scolaire' value={formatAmount(financialSummary?.frais)} />
            <DetailField label='Dette reportee' value={formatAmount(financialSummary?.detteReportee)} />
            <DetailField label='Total a payer' value={formatAmount(financialSummary?.totalAPayer)} />
            <DetailField label='Total paye' value={formatAmount(financialSummary?.montantPaye)} />
            <DetailField label='Reste a payer' value={formatAmount(financialSummary?.resteAPayer)} />
          </DetailSection>

          <DetailSection
            title='Actions'
            actions={(
              <>
                <Button
                  type='button'
                  variant='ghost'
                  label={isCancelling ? 'Annulation...' : 'Annuler l\'entrée'}
                  icon={<Ban size={16} />}
                  loading={isCancelling}
                  disabled={isEditing || isDeleting || status === 'ANNULE'}
                  onClick={handleAnnuler}
                  className='inscription-action inscription-action--secondary'
                />
                <Button
                  type='button'
                  variant='ghost'
                  label={isDeleting ? 'Suppression...' : 'Supprimer'}
                  icon={<Trash2 size={16} />}
                  loading={isDeleting}
                  disabled={isEditing || isCancelling}
                  onClick={handleDelete}
                  className='inscription-action classe-delete-action'
                />
              </>
            )}
          >
            <DetailField label='Date de creation' value={formatDate(paiement.created_at || paiement.createdAt)} />
            <DetailField label='Derniere modification' value={formatDate(paiement.updated_at || paiement.updatedAt)} />
          </DetailSection>
        </div>
      )}
    </section>
  )
}

export default PaiementDetailPage
