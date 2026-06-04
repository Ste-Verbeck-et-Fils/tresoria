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
} from '../../../services/depenseService'
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
  getAnneeScolaireOptionLabel,
  getDepenseAnneeScolaire,
  getDepenseDate,
  getDepenseMontant,
  getDepensePayload,
  getDepenseStatus,
  isAnneeScolaireCloturee,
  normalizeDepenseForm,
  unwrapDepense,
  validateDepenseForm,
} from '../utils/depense'

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
      setLoadError(error.message || 'Impossible de charger cette depense.')
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
          setLoadError(error.message || 'Impossible de charger cette depense.')
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
  const isActionPending = isSaving || isCancelling || isDeleting

  const anneeOptions = useMemo(
    () => anneesScolaires.map((annee) => {
      const isClosed = isAnneeScolaireCloturee(annee)

      return {
        value: annee.id,
        label: getAnneeScolaireOptionLabel(annee),
        searchText: annee.statut || annee.status || '',
        disabled: isClosed,
        disabledReason: isClosed ? 'Depense interdite : annee scolaire cloturee' : '',
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

  const handleSaveEdit = async () => {
    setFeedback({ type: '', message: '' })

    const nextErrors = validateDepenseForm(editForm, selectedEditAnnee)
    setEditErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)

    try {
      await updateDepense(id, getDepensePayload(editForm))
      setIsEditing(false)
      await refreshAfterMutation('Depense modifiee avec succes.')
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de modifier cette depense.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAnnuler = async () => {
    const isConfirmed = window.confirm(`Annuler la depense #${id} ?`)

    if (!isConfirmed) {
      return
    }

    setFeedback({ type: '', message: '' })
    setIsCancelling(true)

    try {
      await annulerDepense(id)
      await refreshAfterMutation('Depense annulee avec succes.')
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible d annuler cette depense.' })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDelete = async () => {
    const isConfirmed = window.confirm(`Supprimer la depense #${id} ? Cette action est irreversible.`)

    if (!isConfirmed) {
      return
    }

    setFeedback({ type: '', message: '' })
    setIsDeleting(true)

    try {
      await deleteDepense(id)
      navigate('/depenses', {
        replace: true,
        state: { successMessage: 'Depense supprimee avec succes.' },
      })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de supprimer cette depense.' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/depenses' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux depenses
          </Link>
          <p className='inscription-page-kicker'>Module depense</p>
          <h1>Detail de la depense #{id}</h1>
          <p className='inscription-page-description'>
            Consultez la depense, modifiez ses informations ou annulez-la si necessaire.
          </p>
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

      {isLoading && <div className='inscription-loading'>Chargement de la depense...</div>}

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
            title={`Depense #${depense.id || id}`}
            subtitle={formatAmount(getDepenseMontant(depense))}
            meta={getDesignation(anneeScolaire, `Annee #${depense.annee_scolaire_id || '-'}`)}
            badge={<StatusBadge value={status} />}
          />

          <DetailSection
            title='Informations de la depense'
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
                    disabled={isActionPending}
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
                      <dd>Depense interdite : l annee scolaire selectionnee est cloturee.</dd>
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
                    <dt>Motif</dt>
                    <dd>
                      <Input
                        id='motif'
                        type='text'
                        value={editForm.motif}
                        error={editErrors.motif}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Date de depense</dt>
                    <dd>
                      <Input
                        id='date_depense'
                        type='date'
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
                        disabled={isSaving}
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
                  <DetailField label='Motif' value={depense.motif || depense.type} />
                  <DetailField label='Date de depense' value={formatDate(getDepenseDate(depense))} />
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
                  label={isCancelling ? 'Annulation...' : 'Annuler la depense'}
                  icon={<Ban size={16} />}
                  loading={isCancelling}
                  disabled={isEditing || isDeleting || isDepenseCancelled}
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
            <DetailField label='Date de creation' value={formatDate(depense.created_at || depense.createdAt)} />
            <DetailField label='Derniere modification' value={formatDate(depense.updated_at || depense.updatedAt)} />
          </DetailSection>
        </div>
      )}
    </section>
  )
}

export default DepenseDetailPage
