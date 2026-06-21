import Loader from '../../../components/ui/Loader'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { ArrowLeft, Ban, FileText, PencilLine } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import { getTransfertById, annulerTransfert, regulariserTransfert, validerTransfert, updateTransfert } from '../../../services/transfertService'
import { getComptesTresorerie } from '../../../services/compteTresorerieService'
import PasswordConfirmModal from '../../../components/ui/PasswordConfirmModal'
import DetailField from '../../inscriptions/components/DetailField'
import DetailSection from '../../inscriptions/components/DetailSection'
import DetailSummaryCard from '../../inscriptions/components/DetailSummaryCard'
import ModuleState from '../../inscriptions/components/ModuleState'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import SelectField from '../../inscriptions/components/SelectField'
import Input from '../../../components/ui/Input'
import { formatDate, normalizeCollection } from '../../inscriptions/utils/data'
import { formatAmount } from '../../inscriptions/utils/amounts'

const TransfertDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()

  const navigate = useNavigate()
  const [transfert, setTransfert] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const [isCancelling, setIsCancelling] = useState(false)
  const [isRegularizing, setIsRegularizing] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    compte_source_id: '',
    compte_destination_id: '',
    montant: '',
    description: '',
    reference: '',
    date_mouvement: ''
  })
  const [editErrors, setEditErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [comptes, setComptes] = useState([])
  const [showWarning, setShowWarning] = useState(true)

  const loadComptes = useCallback(async () => {
    try {
      const payload = await getComptesTresorerie()
      setComptes(normalizeCollection(payload))
    } catch (err) {
      console.error('Error loading accounts:', err)
    }
  }, [])

  useEffect(() => {
    loadComptes()
  }, [loadComptes])

  const compteOptions = useMemo(() => {
    const options = []

    const banque = comptes.find(c => c.type === 'BANQUE' || c.nom === 'Banque' || c.nom === 'Banque Principale')
    if (banque) options.push({ value: banque.id, label: 'Banque' })

    const caisse = comptes.find(c => c.nom === 'CAISSE_GENERAL') || comptes.find(c => c.type === 'CAISSE' && c.nature === 'GENERAL' && c.nom !== 'Banque')
    if (caisse) options.push({ value: caisse.id, label: 'Caisse' })

    const mm = comptes.find(c => c.nom === 'MOBILE_MONEY_GENERAL') || comptes.find(c => c.type === 'MOBILE_MONEY' && c.nature === 'GENERAL')
    if (mm) options.push({ value: mm.id, label: 'Mobile Money' })

    return options
  }, [comptes])

  const normalizeTransfertForm = (t) => ({
    compte_source_id: t?.compte_source_id || '',
    compte_destination_id: t?.compte_destination_id || '',
    montant: t?.montant || '',
    description: t?.description || '',
    reference: t?.reference || '',
    date_mouvement: t?.date_mouvement ? new Date(t.date_mouvement).toISOString().split('T')[0] : ''
  })

  const handleStartEdit = () => {
    setEditForm(normalizeTransfertForm(transfert))
    setEditErrors({})
    setFeedback({ type: '', message: '' })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditForm(normalizeTransfertForm(transfert))
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

  const validateTransfertForm = (formForm) => {
    const errs = {}
    if (!formForm.compte_source_id) errs.compte_source_id = 'Le compte source est requis'
    if (!formForm.compte_destination_id) errs.compte_destination_id = 'Le compte destination est requis'
    if (formForm.compte_source_id && formForm.compte_destination_id && String(formForm.compte_source_id) === String(formForm.compte_destination_id)) {
      errs.compte_destination_id = 'Le compte destination doit être différent du compte source'
    }
    if (!formForm.montant || Number(formForm.montant) <= 0) {
      errs.montant = 'Le montant doit être supérieur à zéro'
    }
    if (!formForm.date_mouvement) {
      errs.date_mouvement = 'La date est requise'
    } else {
      const dateVal = new Date(formForm.date_mouvement)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(today.getDate() - 3)
      threeDaysAgo.setHours(0, 0, 0, 0)

      if (dateVal > today) {
        errs.date_mouvement = 'La date ne peut pas être dans le futur'
      } else if (dateVal < threeDaysAgo) {
        errs.date_mouvement = 'La date ne peut pas remonter à plus de 3 jours dans le passé'
      }
    }
    return errs
  }

  const hasChanges = () => {
    if (!transfert) return false
    const originalForm = normalizeTransfertForm(transfert)
    return (
      String(editForm.compte_source_id) !== String(originalForm.compte_source_id) ||
      String(editForm.compte_destination_id) !== String(originalForm.compte_destination_id) ||
      Number(editForm.montant) !== Number(originalForm.montant) ||
      editForm.description.trim() !== originalForm.description.trim() ||
      editForm.reference.trim() !== originalForm.reference.trim() ||
      editForm.date_mouvement !== originalForm.date_mouvement
    )
  }

  const handleSaveEdit = async () => {
    setFeedback({ type: '', message: '' })

    const nextErrors = validateTransfertForm(editForm)
    setEditErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    if (isConfirmed) {
      if (!hasChanges()) {
        setFeedback({
          type: 'warning',
          message: "Aucune information n'a été modifiée. La régularisation n'est pas nécessaire."
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
      await updateTransfert(id, {
        compte_source_id: parseInt(editForm.compte_source_id),
        compte_destination_id: parseInt(editForm.compte_destination_id),
        montant: Number(editForm.montant),
        description: editForm.description,
        reference: editForm.reference,
        date_mouvement: editForm.date_mouvement
      })
      setIsEditing(false)
      await refreshAfterMutation('Transfert modifié avec succès.')
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de modifier ce transfert.' })
    } finally {
      setIsSaving(false)
    }
  }

  const refreshAfterMutation = async (successMessage) => {
    const data = await getTransfertById(id)
    setTransfert(data?.data || data)
    setFeedback({ type: 'success', message: successMessage })
  }

  const loadTransfertData = async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const data = await getTransfertById(id)
      setTransfert(data?.data || data)
    } catch (error) {
      setLoadError(error.message || 'Impossible de charger ce transfert.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    const fetchTransfert = async () => {
      try {
        const data = await getTransfertById(id)
        if (!isCancelled) {
          setTransfert(data?.data || data)
          setLoadError('')
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error.message || 'Impossible de charger ce transfert.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchTransfert()

    return () => {
      isCancelled = true
    }
  }, [id])

  const handlePasswordConfirm = () => {
    setShowPasswordModal(false)
    if (pendingAction === 'annuler') {
      executeAnnuler()
    } else if (pendingAction === 'regulariser') {
      executeRegulariser()
    } else if (pendingAction === 'valider') {
      executeValider()
    }
    setPendingAction(null)
  }

  const handleAnnuler = () => {
    setPendingAction('annuler')
    setShowPasswordModal(true)
  }

  const executeAnnuler = async () => {
    setFeedback({ type: '', message: '' })
    setIsCancelling(true)

    try {
      await annulerTransfert(id)
      setFeedback({ type: 'success', message: 'Transfert annulé avec succes.' })
      await loadTransfertData()
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible d annuler ce transfert.' })
    } finally {
      setIsCancelling(false)
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
      const response = await regulariserTransfert(id)
      const newTransfertId = response.data?.transfert?.id || response.transfert?.id || response.data?.id
      if (newTransfertId) {
        // Apply modifications to the new draft transfert
        await updateTransfert(newTransfertId, {
          compte_source_id: parseInt(editForm.compte_source_id),
          compte_destination_id: parseInt(editForm.compte_destination_id),
          montant: Number(editForm.montant),
          description: editForm.description,
          reference: editForm.reference,
          date_mouvement: editForm.date_mouvement
        })
        setIsEditing(false)
        navigate(`/tresorerie/transferts/${newTransfertId}`, {
          replace: true,
          state: { successMessage: 'Contre-passation effectuée et modifications enregistrées. Vous êtes maintenant sur le transfert brouillon.' },
        })
      } else {
        await loadTransfertData()
        setFeedback({ type: 'success', message: 'Transfert régularisé avec succès.' })
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de régulariser ce transfert.' })
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
      await validerTransfert(id)
      setFeedback({ type: 'success', message: 'Transfert validé avec succès.' })
      await loadTransfertData()
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de valider ce transfert.' })
    } finally {
      setIsValidating(false)
    }
  }

  const status = String(transfert?.statut || '').toUpperCase()
  const isTransfertCancelled = status.startsWith('ANNUL')
  const isConfirmed = status === 'CONFIRME'
  const isDraft = status === 'DRAFT'
  const isActionPending = isSaving || isCancelling || isRegularizing || isValidating
  const isAlreadyRegularized = transfert?.reference?.includes('-REV')

  useEffect(() => {
    if (transfert && isAlreadyRegularized) {
      setShowWarning(true)
      const timer = setTimeout(() => {
        setShowWarning(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [transfert, isAlreadyRegularized])

  useEffect(() => {
    if (feedback.message) {
      const dismissTime = (feedback.message.toLowerCase().includes('validé') || feedback.message.toLowerCase().includes('valide')) ? 10000 : 5000
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' })
      }, dismissTime)
      return () => clearTimeout(timer)
    }
  }, [feedback.message])

  const todayStr = new Date().toISOString().split('T')[0]
  const minDateVal = new Date()
  minDateVal.setDate(minDateVal.getDate() - 3)
  const minDateStr = minDateVal.toISOString().split('T')[0]

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/tresorerie/transferts' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux transferts
          </Link>
          <h1>Detail du transfert #{id}</h1>
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
          message="Ce transfert est issu d'une régularisation (contre-passation) et ne peut plus être régularisé à nouveau."
        />
      )}

      {isLoading && <Loader message='Chargement du transfert...' />}

      {!isLoading && loadError && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={loadError}
          actionLabel='Reessayer'
          onAction={loadTransfertData}
        />
      )}

      {!isLoading && !loadError && transfert && (
        <div className='detail-page-stack'>
          <DetailSummaryCard
            icon={<FileText size={36} aria-hidden='true' />}
            title={`Transfert ${transfert.reference || '#' + transfert.id}`}
            subtitle={formatAmount(transfert.montant)}
            meta={`Le ${formatDate(transfert.date_mouvement)}`}
            badge={<StatusBadge value={transfert.statut} />}
          />

          <DetailSection
            title='Informations du transfert'
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
                    disabled={isActionPending || isTransfertCancelled || (isConfirmed && isAlreadyRegularized)}
                    onClick={handleStartEdit}
                    className='inscription-action inscription-action--secondary'
                  />
                  )
            )}
          >
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
                        step='0.01'
                        value={editForm.montant}
                        error={editErrors.montant}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Date de transfert</dt>
                    <dd>
                      <Input
                        id='date_mouvement'
                        type='date'
                        min={minDateStr}
                        max={todayStr}
                        value={editForm.date_mouvement}
                        error={editErrors.date_mouvement}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Compte source</dt>
                    <dd>
                      <SelectField
                        id='compte_source_id'
                        label=''
                        value={editForm.compte_source_id}
                        options={compteOptions}
                        placeholder='Sélectionner le compte source'
                        error={editErrors.compte_source_id}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Compte destination</dt>
                    <dd>
                      <SelectField
                        id='compte_destination_id'
                        label=''
                        value={editForm.compte_destination_id}
                        options={compteOptions}
                        placeholder='Sélectionner le compte destination'
                        error={editErrors.compte_destination_id}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Référence externe</dt>
                    <dd>
                      <Input
                        id='reference'
                        type='text'
                        value={editForm.reference}
                        disabled={isSaving || isConfirmed || editForm.reference?.includes('-REV')}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing inscription-detail-field--wide'>
                    <dt>Description</dt>
                    <dd>
                      <Input
                        id='description'
                        variant='textarea'
                        value={editForm.description}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                </>
                )
              : (
                <>
                  <DetailField label='Reference' value={transfert.reference || '#' + transfert.id} />
                  <DetailField label='Date de transfert' value={formatDate(transfert.date_mouvement)} />
                  <DetailField label='Montant' value={formatAmount(transfert.montant)} />
                  <DetailField label='Compte source' value={transfert.compte_source?.nom || '-'} />
                  <DetailField label='Compte destination' value={transfert.compte_destination?.nom || '-'} />
                  <DetailField label='Statut' value={<StatusBadge value={transfert.statut} />} />
                  <DetailField label='Description' value={transfert.description || '-'} />
                  <DetailField label='Crée par' value={transfert.creator?.full_name || transfert.creator?.phone || '-'} />
                </>
                )}
          </DetailSection>

          <DetailSection
            title='Actions'
            actions={(
              <>
                <Button
                  type='button'
                  variant='ghost'
                  label={isCancelling ? 'Annulation...' : 'Annuler le transfert'}
                  icon={<Ban size={16} />}
                  loading={isCancelling}
                  disabled={isTransfertCancelled || isConfirmed || isActionPending || isEditing}
                  onClick={handleAnnuler}
                  className='inscription-action inscription-action--secondary'
                />
                {isConfirmed && (
                  <Button
                    type='button'
                    variant='ghost'
                    label={isRegularizing ? 'Régularisation...' : 'Régulariser'}
                    icon={<PencilLine size={16} />}
                    loading={isRegularizing}
                    disabled={isActionPending || isAlreadyRegularized || isEditing}
                    onClick={handleRegulariser}
                    className='inscription-action inscription-action--secondary'
                  />
                )}
                {isDraft && (
                  <Button
                    type='button'
                    variant='super'
                    label={isValidating ? 'Validation...' : 'Valider'}
                    icon={<FileText size={16} />}
                    loading={isValidating}
                    disabled={isActionPending || isEditing}
                    onClick={handleValider}
                    className='inscription-action inscription-action--primary'
                  />
                )}
              </>
            )}
          >
            <DetailField label='Date de creation' value={formatDate(transfert.created_at || transfert.createdAt)} />
            <DetailField label='Derniere modification' value={formatDate(transfert.updated_at || transfert.updatedAt)} />
          </DetailSection>
        </div>
      )}

      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setPendingAction(null) }}
        onConfirm={handlePasswordConfirm}
        title='Confirmation requise'
        message={pendingAction === 'annuler' ? 'Veuillez saisir votre mot de passe pour confirmer l annulation du transfert.' : pendingAction === 'valider' ? 'Veuillez saisir votre mot de passe pour valider le transfert.' : 'Veuillez saisir votre mot de passe pour confirmer la régularisation (contre-passation).'}
        actionLabel={pendingAction === 'annuler' ? 'Annuler le transfert' : pendingAction === 'valider' ? 'Valider' : 'Régulariser'}
      />
    </section>
  )
}

export default TransfertDetailPage
