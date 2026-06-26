import Loader from '../../../components/ui/Loader'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Ban, CreditCard, PencilLine, Printer, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import logoGsEmmanuel from '../../../assets/images/logo_gsemmanuel.png'
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
  regulariserPaiement,
  validerPaiement,
} from '../../../services/paiementService'
import PasswordConfirmModal from '../../../components/ui/PasswordConfirmModal'
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
  getTransactionDateConstraints,
} from '../utils/paiement'

const { minDate: minDateTransaction, maxDate: maxDateTransaction } = getTransactionDateConstraints()

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
  const [isRegularizing, setIsRegularizing] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [hasPrinted, setHasPrinted] = useState(false)
  const [showWarning, setShowWarning] = useState(true)

  useEffect(() => {
    if (paiement && inscription && location.state?.autoPrint && !hasPrinted) {
      setHasPrinted(true)
      setTimeout(() => window.print(), 500)
    }
  }, [paiement, inscription, location.state, hasPrinted])

  const handlePasswordConfirm = () => {
    setShowPasswordModal(false)
    if (pendingAction === 'annuler') {
      executeAnnuler()
    } else if (pendingAction === 'delete') {
      executeDelete()
    } else if (pendingAction === 'edit') {
      executeEdit()
    } else if (pendingAction === 'regulariser') {
      executeRegulariser()
    } else if (pendingAction === 'valider') {
      executeValider()
    }
    setPendingAction(null)
  }

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

  const hasChanges = () => {
    if (!paiement) return false
    const originalForm = normalizePaiementForm({
      ...paiement,
      inscription_id: inscription?.id || paiement?.inscription_id || '',
    })

    return (
      Number(editForm.montant) !== Number(originalForm.montant) ||
      editForm.motif !== originalForm.motif ||
      editForm.mode_paiement !== originalForm.mode_paiement ||
      editForm.date_paiement !== originalForm.date_paiement ||
      editForm.reference.trim() !== originalForm.reference.trim() ||
      (editForm.description || '').trim() !== (originalForm.description || '').trim() ||
      editForm.transport_date_debut !== originalForm.transport_date_debut ||
      Number(editForm.transport_nombre_mois) !== Number(originalForm.transport_nombre_mois) ||
      Number(editForm.tarif_mensuel_transport) !== Number(originalForm.tarif_mensuel_transport)
    )
  }

  const handleSaveEdit = async () => {
    setFeedback({ type: '', message: '' })

    const nextErrors = validatePaiementForm(editForm, inscription)
    setEditErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const currentStatus = getPaiementStatus(paiement)
    if (currentStatus === 'CONFIRME') {
      if (!hasChanges()) {
        setFeedback({
          type: 'warning',
          message: 'Aucune information n\'a été modifiée. La régularisation n\'est pas nécessaire.'
        })
        return
      }
      setPendingAction('regulariser')
      setShowPasswordModal(true)
    } else {
      executeEdit()
    }
  }

  const executeEdit = async () => {
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

  const handleAnnuler = () => {
    setPendingAction('annuler')
    setShowPasswordModal(true)
  }

  const executeAnnuler = async () => {
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

  const handleDelete = () => {
    setPendingAction('delete')
    setShowPasswordModal(true)
  }

  const executeDelete = async () => {
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

  const handleRegulariser = () => {
    setPendingAction('regulariser')
    setShowPasswordModal(true)
  }

  const executeRegulariser = async () => {
    setFeedback({ type: '', message: '' })
    setIsRegularizing(true)

    try {
      const response = await regulariserPaiement(id)
      const newPaiementId = response.data?.paiement?.id || response.paiement?.id
      if (newPaiementId) {
        // Apply modifications to the new draft payment
        await updatePaiement(newPaiementId, getPaiementPayload(editForm))
        setIsEditing(false)
        navigate(`/paiements/${newPaiementId}`, {
          replace: true,
          state: { successMessage: 'Contre-passation effectuée et modifications enregistrées. Vous êtes maintenant sur le paiement brouillon.' },
        })
      } else {
        await refreshAfterMutation('Entrée régularisée avec succès.')
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de régulariser cette entrée.' })
    } finally {
      setIsRegularizing(false)
    }
  }

  const handleValider = () => {
    setPendingAction('valider')
    setShowPasswordModal(true)
  }

  const executeValider = async () => {
    setFeedback({ type: '', message: '' })
    setIsValidating(true)

    try {
      await validerPaiement(id)
      await refreshAfterMutation('Entrée validée avec succès.')
      setTimeout(() => window.print(), 500)
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de valider cette entrée.' })
    } finally {
      setIsValidating(false)
    }
  }

  const student = inscription ? getInscriptionStudent(inscription) : null
  const classe = inscription ? getInscriptionClasse(inscription) : null
  const anneeScolaire = inscription ? getInscriptionAnnee(inscription) : null
  const isInscriptionClosed = inscription ? isAnneeScolaireCloturee(inscription) : false
  const financialSummary = inscription ? getInscriptionFinancialSummary(inscription, solde) : null
  const status = paiement ? getPaiementStatus(paiement) : ''
  const isConfirmed = status === 'CONFIRME'
  const isCancelled = status === 'ANNULE'
  const isPending = status === 'EN_ATTENTE'
  const isDraft = status === 'DRAFT'
  const isActionPending = isSaving || isCancelling || isDeleting || isRegularizing || isValidating
  const isAlreadyRegularized = paiement?.reference?.includes('-REV')

  useEffect(() => {
    if (paiement && isAlreadyRegularized) {
      setShowWarning(true)
      const timer = setTimeout(() => {
        setShowWarning(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [paiement, isAlreadyRegularized])

  useEffect(() => {
    if (feedback.message) {
      const dismissTime = (feedback.message.toLowerCase().includes('validé') || feedback.message.toLowerCase().includes('valide')) ? 10000 : 5000
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' })
      }, dismissTime)
      return () => clearTimeout(timer)
    }
  }, [feedback.message])

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

      {isConfirmed && isAlreadyRegularized && showWarning && (
        <Feedback
          type='warning'
          message="Cette entrée est issue d'une régularisation (contre-passation) et ne peut plus être modifiée ni régularisée à nouveau."
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
                      label={isConfirmed ? (isSaving || isRegularizing ? 'Régularisation...' : 'Régulariser') : (isSaving ? 'Enregistrement...' : 'Enregistrer')}
                      loading={isSaving || isRegularizing}
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
                    disabled={isActionPending || isInscriptionClosed || isCancelled || isPending || (isConfirmed && isAlreadyRegularized)}
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
                    <dt>Date de l entrée</dt>
                    <dd>
                      <Input
                        id='date_paiement'
                        type='date'
                        min={minDateTransaction}
                        max={maxDateTransaction}
                        value={editForm.date_paiement}
                        error={editErrors.date_paiement}
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
                        disabled={isSaving || paiement?.statut === 'CONFIRME' || editForm.reference?.includes('-REV')}
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
                  variant='super'
                  label='Imprimer le reçu'
                  icon={<Printer size={16} />}
                  onClick={() => isConfirmed && window.print()}
                  disabled={!isConfirmed}
                  className='inscription-action inscription-action--primary'
                />
                <Button
                  type='button'
                  variant='ghost'
                  label={isCancelling ? 'Annulation...' : 'Annuler l\'entrée'}
                  icon={<Ban size={16} />}
                  loading={isCancelling}
                  disabled={isEditing || isDeleting || isConfirmed || isCancelled || isPending}
                  onClick={handleAnnuler}
                  className='inscription-action inscription-action--secondary'
                />
                {isDraft && (
                  <Button
                    type='button'
                    variant='super'
                    label={isValidating ? 'Validation...' : 'Valider'}
                    icon={<CreditCard size={16} />}
                    loading={isValidating}
                    disabled={isActionPending}
                    onClick={handleValider}
                    className='inscription-action inscription-action--primary'
                  />
                )}
                <Button
                  type='button'
                  variant='ghost'
                  label={isDeleting ? 'Suppression...' : 'Supprimer'}
                  icon={<Trash2 size={16} />}
                  loading={isDeleting}
                  disabled={isActionPending || isConfirmed || isCancelled || isPending}
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

      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setPendingAction(null) }}
        onConfirm={handlePasswordConfirm}
        title='Confirmation requise'
        message={pendingAction === 'annuler' ? 'Veuillez saisir votre mot de passe pour confirmer l annulation.' : pendingAction === 'edit' ? 'Veuillez saisir votre mot de passe pour confirmer la modification.' : pendingAction === 'regulariser' ? 'Veuillez saisir votre mot de passe pour confirmer la régularisation (contre-passation).' : pendingAction === 'valider' ? 'Veuillez saisir votre mot de passe pour valider l entrée.' : 'Veuillez saisir votre mot de passe pour confirmer la suppression.'}
        actionLabel={pendingAction === 'annuler' ? 'Annuler l entrée' : pendingAction === 'edit' ? 'Enregistrer' : pendingAction === 'regulariser' ? 'Régulariser' : pendingAction === 'valider' ? 'Valider' : 'Supprimer'}
      />

      {/* Reçu d'impression */}
      {!isLoading && !loadError && paiement && inscription && isConfirmed && (
        <div className='print-only receipt-card'>
          <div className='receipt-header'>
            <div className='receipt-header-left'>
              <img src={logoGsEmmanuel} alt='Logo GS Emmanuel' className='receipt-logo' />
              <div>
                <h1 className='receipt-school-name'>GS EMMANUEL</h1>
                <p className='receipt-school-sub'>Complexe Scolaire Bilingue</p>
              </div>
            </div>
            <div className='receipt-header-right'>
              <div className='receipt-badge'>REÇU DE PAIEMENT</div>
              <p className='receipt-number'>N° #{paiement.id || id}</p>
              <p className='receipt-date'>Date : {formatDate(getPaiementDate(paiement))}</p>
            </div>
          </div>

          <div className='receipt-divider' />

          <div className='receipt-section'>
            <h3 className='receipt-section-title'>Informations de l'Élève</h3>
            <div className='receipt-grid-3'>
              <div>
                <span className='receipt-meta-label'>Élève</span>
                <span className='receipt-meta-value'>{getStudentName(student)}</span>
              </div>
              <div>
                <span className='receipt-meta-label'>Classe</span>
                <span className='receipt-meta-value'>{getDesignation(classe, `Classe #${inscription?.class_id || '-'}`)}</span>
              </div>
              <div>
                <span className='receipt-meta-label'>Année Scolaire</span>
                <span className='receipt-meta-value'>{getDesignation(anneeScolaire, `Année #${inscription?.annee_scolaire_id || '-'}`)}</span>
              </div>
            </div>
          </div>

          <div className='receipt-divider' />

          <table className='receipt-table'>
            <thead>
              <tr>
                <th>Description / Motif du Paiement</th>
                <th style={{ textAlign: 'center' }}>Mode</th>
                <th style={{ textAlign: 'right' }}>Réf. Transaction</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{getPaiementMotifLabel(paiement.motif || paiement.type)}</strong>
                  {(paiement.motif === 'FRAIS_TRANSPORT' || paiement.type === 'FRAIS_TRANSPORT') && paiement.transport_date_debut && (
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                      Période: {formatDate(paiement.transport_date_debut)} au {formatDate(paiement.transport_date_fin)} ({paiement.transport_nombre_mois} mois)
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>{getPaiementModeLabel(paiement.mode_paiement || paiement.modePaiement || paiement.mode)}</td>
                <td style={{ textAlign: 'right' }}>{paiement.reference || paiement.transaction_reference || '-'}</td>
                <td style={{ textAlign: 'right' }} className='receipt-amount'>{formatAmount(getPaiementMontant(paiement))}</td>
              </tr>
            </tbody>
          </table>

          <div className='receipt-summary'>
            <div className='receipt-summary-row'>
              <span>Montant Payé :</span>
              <strong>{formatAmount(getPaiementMontant(paiement))}</strong>
            </div>
            {(paiement.motif === 'FRAIS_SCOLAIRE' || paiement.type === 'FRAIS_SCOLAIRE') && (
              <>
                <div className='receipt-summary-row receipt-summary-row--small'>
                  <span>Frais de l'année scolaire :</span>
                  <span>{formatAmount(financialSummary?.frais)}</span>
                </div>
                <div className='receipt-summary-row receipt-summary-row--small'>
                  <span>Dette reportée :</span>
                  <span>{formatAmount(financialSummary?.detteReportee)}</span>
                </div>
                <div className='receipt-summary-row receipt-summary-row--small'>
                  <span>Total payé à ce jour :</span>
                  <span>{formatAmount(financialSummary?.montantPaye)}</span>
                </div>
                <div className='receipt-summary-row receipt-summary-row--highlight'>
                  <span>Reste à payer :</span>
                  <span>{formatAmount(financialSummary?.resteAPayer)}</span>
                </div>
              </>
            )}
          </div>

          <div className='receipt-signatures'>
            <div className='receipt-signature-box'>
              <span>Le Parent / Déposant</span>
              <div className='signature-line' />
            </div>
            <div className='receipt-signature-box'>
              <span>Pour le Secrétariat / La Caisse</span>
              <div className='signature-line' />
            </div>
          </div>

          <div className='receipt-footer-new'>
            <p>Merci pour votre confiance. L'éducation est notre priorité.</p>
            <p>Imprimé le {new Date().toLocaleString('fr-FR')} | Tresoria App</p>
          </div>
        </div>
      )}
    </section>
  )
}

export default PaiementDetailPage
