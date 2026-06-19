import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Ban, FileText, PencilLine, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import {
  getAnneeScolaire,
  getAnneesScolaires,
} from '../../../services/anneeScolaireService'
import {
  annulerDepense,
  deleteDepense,
  getDepense,
  updateDepense,
  regulariserDepense,
  validerDepense,
} from '../../../services/depenseService'
import PasswordConfirmModal from '../../../components/ui/PasswordConfirmModal'
import DetailField from '../../inscriptions/components/DetailField'
import DetailSection from '../../inscriptions/components/DetailSection'
import DetailSummaryCard from '../../inscriptions/components/DetailSummaryCard'
import ModuleState from '../../inscriptions/components/ModuleState'
import SearchableSelectField from '../../inscriptions/components/SearchableSelectField'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import {
  formatDate,
  getDesignation,
  normalizeCollection,
} from '../../inscriptions/utils/data'
import { formatAmount } from '../../inscriptions/utils/amounts'
import {
  CATEGORIE_DEPENSE_OPTIONS,
  getAnneeScolaireOptionLabel,
  getDepenseAnneeScolaire,
  getDepenseDate,
  getDepenseMontant,
  getDepensePayload,
  getDepenseStatus,
  getDepenseModePaiement,
  getDepenseBeneficiaire,
  getDepenseCategorie,
  isAnneeScolaireCloturee,
  normalizeDepenseForm,
  unwrapDepense,
  validateDepenseForm,
  getTransactionDateConstraints,
} from '../utils/depense'

const { minDate: minDateTransaction, maxDate: maxDateTransaction } = getTransactionDateConstraints()

const resolveDepenseBundle = async (id) => {
  const depensePayload = await getDepense(id)
  const depense = unwrapDepense(depensePayload)
  const attachedAnnee = getDepenseAnneeScolaire(depense)
  const anneeId = attachedAnnee?.id || depense?.annee_scolaire_id
  let anneeScolaire = attachedAnnee || null

  if (!anneeScolaire && anneeId) {
    const anneePayload = await getAnneeScolaire(anneeId)
    anneeScolaire = anneePayload?.annee_scolaire || anneePayload?.data?.annee_scolaire || anneePayload?.data || anneePayload
  }

  return { depense, anneeScolaire }
}

const DepenseDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [depense, setDepense] = useState(null)
  const [anneeScolaire, setAnneeScolaire] = useState(null)
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(normalizeDepenseForm())
  const [editErrors, setEditErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRegularizing, setIsRegularizing] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [showWarning, setShowWarning] = useState(true)

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

  const applyAnneesPayload = useCallback((payload) => {
    setAnneesScolaires(normalizeCollection(payload))
  }, [])

  const loadDepenseData = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const [bundle, anneesPayload] = await Promise.all([
        resolveDepenseBundle(id),
        getAnneesScolaires(),
      ])

      setDepense(bundle.depense)
      setAnneeScolaire(bundle.anneeScolaire)
      applyAnneesPayload(anneesPayload)
    } catch (error) {
      setLoadError(error.message || 'Impossible de charger cette sortie.')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAfterMutation = async (successMessage) => {
    const bundle = await resolveDepenseBundle(id)

    setDepense(bundle.depense)
    setAnneeScolaire(bundle.anneeScolaire)
    setFeedback({ type: 'success', message: successMessage })
  }

  useEffect(() => {
    let isCancelled = false

    Promise.all([
      resolveDepenseBundle(id),
      getAnneesScolaires(),
    ])
      .then(([bundle, anneesPayload]) => {
        if (!isCancelled) {
          setDepense(bundle.depense)
          setAnneeScolaire(bundle.anneeScolaire)
          applyAnneesPayload(anneesPayload)
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setLoadError(error.message || 'Impossible de charger cette sortie.')
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
  }, [applyAnneesPayload, id])

  const selectedEditAnnee = useMemo(
    () => anneesScolaires.find((annee) => String(annee.id) === String(editForm.annee_scolaire_id)),
    [anneesScolaires, editForm.annee_scolaire_id]
  )
  const isSelectedEditAnneeClosed = selectedEditAnnee ? isAnneeScolaireCloturee(selectedEditAnnee) : false
  const status = depense ? getDepenseStatus(depense) : ''
  const isDepenseCancelled = status.toUpperCase().startsWith('ANNU')
  const isConfirmed = status === 'CONFIRME'
  const isDraft = status === 'DRAFT'
  const isActionPending = isSaving || isCancelling || isDeleting || isRegularizing || isValidating
  const isAlreadyRegularized = depense?.reference?.includes('-REV')

  useEffect(() => {
    if (depense && isAlreadyRegularized) {
      setShowWarning(true)
      const timer = setTimeout(() => {
        setShowWarning(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [depense, isAlreadyRegularized])

  useEffect(() => {
    if (feedback.message) {
      const dismissTime = (feedback.message.toLowerCase().includes('validé') || feedback.message.toLowerCase().includes('valide')) ? 10000 : 5000
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' })
      }, dismissTime)
      return () => clearTimeout(timer)
    }
  }, [feedback.message])

  const anneeOptions = useMemo(
    () => anneesScolaires.map((annee) => {
      const isClosed = isAnneeScolaireCloturee(annee)

      return {
        value: annee.id,
        label: getAnneeScolaireOptionLabel(annee),
        searchText: annee.statut || annee.status || '',
        disabled: isClosed,
        disabledReason: isClosed ? 'Sortie interdite : annee scolaire cloturee' : '',
      }
    }),
    [anneesScolaires]
  )

  const handleStartEdit = () => {
    setEditForm(normalizeDepenseForm({
      ...depense,
      annee_scolaire_id: anneeScolaire?.id || depense?.annee_scolaire_id || '',
    }))
    setEditErrors({})
    setFeedback({ type: '', message: '' })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditForm(normalizeDepenseForm({
      ...depense,
      annee_scolaire_id: anneeScolaire?.id || depense?.annee_scolaire_id || '',
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
    if (!depense) return false
    const originalForm = normalizeDepenseForm({
      ...depense,
      annee_scolaire_id: anneeScolaire?.id || depense?.annee_scolaire_id || '',
    })
    
    return (
      Number(editForm.annee_scolaire_id) !== Number(originalForm.annee_scolaire_id) ||
      editForm.libelle.trim() !== originalForm.libelle.trim() ||
      editForm.categorie !== originalForm.categorie ||
      Number(editForm.montant) !== Number(originalForm.montant) ||
      editForm.mode_paiement !== originalForm.mode_paiement ||
      editForm.beneficiaire.trim() !== originalForm.beneficiaire.trim() ||
      editForm.description.trim() !== originalForm.description.trim() ||
      editForm.date_depense !== originalForm.date_depense ||
      editForm.reference.trim() !== originalForm.reference.trim()
    )
  }

  const handleSaveEdit = async () => {
    setFeedback({ type: '', message: '' })

    const nextErrors = validateDepenseForm(editForm, selectedEditAnnee)
    setEditErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const currentStatus = getDepenseStatus(depense)
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
      await updateDepense(id, getDepensePayload(editForm))
      setIsEditing(false)
      await refreshAfterMutation('Sortie modifiée avec succes.')
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de modifier cette sortie.' })
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
      await annulerDepense(id)
      await refreshAfterMutation('Sortie annulée avec succes.')
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible d annuler cette sortie.' })
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
      await deleteDepense(id)
      navigate('/depenses', {
        replace: true,
        state: { successMessage: 'Sortie supprimée avec succes.' },
      })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de supprimer cette sortie.' })
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
      const response = await regulariserDepense(id)
      const newDepenseId = response.data?.depense?.id || response.depense?.id
      if (newDepenseId) {
         // Apply modifications to the new draft expense
         await updateDepense(newDepenseId, getDepensePayload(editForm))
         setIsEditing(false)
         navigate(`/depenses/${newDepenseId}`, {
           replace: true,
           state: { successMessage: 'Contre-passation effectuée et modifications enregistrées. Vous êtes maintenant sur la sortie brouillon.' },
         })
      } else {
         await refreshAfterMutation('Sortie régularisée avec succès.')
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de régulariser cette sortie.' })
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
      await validerDepense(id)
      await refreshAfterMutation('Sortie validée avec succès.')
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de valider cette sortie.' })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/depenses' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux sorties
          </Link>
          <h1>Detail de la sortie #{id}</h1>

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
          message="Cette sortie est issue d'une régularisation (contre-passation) et ne peut plus être modifiée ni régularisée à nouveau."
        />
      )}

      {isLoading && <Loader message='Chargement de la sortie...' />}

      {!isLoading && loadError && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={loadError}
          actionLabel='Reessayer'
          onAction={loadDepenseData}
        />
      )}

      {!isLoading && !loadError && depense && (
        <div className='detail-page-stack'>
          <DetailSummaryCard
            icon={<FileText size={36} aria-hidden='true' />}
            title={`Sortie #${depense.id || id}`}
            subtitle={formatAmount(getDepenseMontant(depense))}
            meta={getDesignation(anneeScolaire, `Annee #${depense.annee_scolaire_id || '-'}`)}
            badge={<StatusBadge value={status} />}
          />

          <DetailSection
            title='Informations de la sortie'
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
                      disabled={isSelectedEditAnneeClosed}
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
                    disabled={isActionPending || isDepenseCancelled || (isConfirmed && isAlreadyRegularized)}
                    onClick={handleStartEdit}
                    className='inscription-action inscription-action--secondary'
                  />
                  )
            )}
          >
            <DetailField label='Reference' value={`#${depense.id || id}`} />
            {isEditing
              ? (
                <>
                  <div className='inscription-detail-field inscription-detail-field--editing inscription-detail-field--wide'>
                    <dt>Annee scolaire</dt>
                    <dd>
                      <SearchableSelectField
                        id='annee_scolaire_id'
                        label=''
                        value={editForm.annee_scolaire_id}
                        options={anneeOptions}
                        placeholder='Rechercher une annee scolaire'
                        emptyMessage='Aucune annee scolaire ne correspond a votre recherche.'
                        error={editErrors.annee_scolaire_id}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  {isSelectedEditAnneeClosed && (
                    <div className='inscription-detail-field inscription-detail-field--wide inscription-solde-error'>
                      <dt>Annee cloturee</dt>
                      <dd>Sortie interdite : l annee scolaire selectionnee est cloturee.</dd>
                    </div>
                  )}
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
                    <dt>Catégorie</dt>
                    <dd>
                      <select
                        id='categorie'
                        className='inscription-select'
                        value={editForm.categorie}
                        disabled={isSaving}
                        onChange={handleEditChange}
                        style={{ width: '100%' }}
                      >
                        <option value=''>Sélectionnez une catégorie</option>
                        {CATEGORIE_DEPENSE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {editErrors.categorie && <span className="inscription-error-text">{editErrors.categorie}</span>}
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Date de sortie</dt>
                    <dd>
                      <Input
                        id='date_depense'
                        type='date'
                        min={minDateTransaction}
                        max={maxDateTransaction}
                        value={editForm.date_depense}
                        error={editErrors.date_depense}
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
                        disabled={isSaving || depense?.statut === 'CONFIRME' || editForm.reference?.includes('-REV')}
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
                  <DetailField label='Annee scolaire' value={getDesignation(anneeScolaire, `Annee #${depense.annee_scolaire_id || '-'}`)} />
                  <DetailField label='Montant' value={formatAmount(getDepenseMontant(depense))} />
                  <DetailField label='Categorie' value={getDepenseCategorie(depense) || '-'} />
                  <DetailField label='Mode' value={getDepenseModePaiement(depense)} />
                  <DetailField label='Beneficiaire' value={getDepenseBeneficiaire(depense) || '-'} />
                  <DetailField label='Date de sortie' value={formatDate(getDepenseDate(depense))} />
                  <DetailField label='Reference externe' value={depense.reference || depense.transaction_reference} />
                  <DetailField label='Statut' value={<StatusBadge value={status} />} />
                  <DetailField label='Description' value={depense.description || depense.observation} />
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
                  label={isCancelling ? 'Annulation...' : 'Annuler la sortie'}
                  icon={<Ban size={16} />}
                  loading={isCancelling}
                  disabled={isEditing || isDeleting || isConfirmed || isDepenseCancelled}
                  onClick={handleAnnuler}
                  className='inscription-action inscription-action--secondary'
                />
                {isDraft && (
                  <Button
                    type='button'
                    variant='super'
                    label={isValidating ? 'Validation...' : 'Valider'}
                    icon={<FileText size={16} />}
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
                  disabled={isActionPending || isConfirmed || isDepenseCancelled}
                  onClick={handleDelete}
                  className='inscription-action classe-delete-action'
                />
              </>
            )}
          >
            <DetailField label='Date de creation' value={formatDate(depense.created_at || depense.createdAt)} />
            <DetailField label='Derniere modification' value={formatDate(depense.updated_at || depense.updatedAt)} />
          </DetailSection>
        </div>
      )}

      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setPendingAction(null) }}
        onConfirm={handlePasswordConfirm}
        title='Confirmation requise'
        message={pendingAction === 'annuler' ? 'Veuillez saisir votre mot de passe pour confirmer l annulation.' : pendingAction === 'edit' ? 'Veuillez saisir votre mot de passe pour confirmer la modification.' : pendingAction === 'regulariser' ? 'Veuillez saisir votre mot de passe pour confirmer la régularisation (contre-passation).' : pendingAction === 'valider' ? 'Veuillez saisir votre mot de passe pour valider la sortie.' : 'Veuillez saisir votre mot de passe pour confirmer la suppression.'}
        actionLabel={pendingAction === 'annuler' ? 'Annuler la sortie' : pendingAction === 'edit' ? 'Enregistrer' : pendingAction === 'regulariser' ? 'Régulariser' : pendingAction === 'valider' ? 'Valider' : 'Supprimer'}
      />
    </section>
  )
}

export default DepenseDetailPage
