import React, { useEffect, useState } from 'react'
import { Archive, ArrowLeft, CalendarRange, PencilLine, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import {
  cloturerAnneeScolaire,
  deleteAnneeScolaire,
  getAnneeScolaire,
  updateAnneeScolaire,
} from '../../../services/anneeScolaireService'
import DetailField from '../../inscriptions/components/DetailField'
import DetailSection from '../../inscriptions/components/DetailSection'
import DetailSummaryCard from '../../inscriptions/components/DetailSummaryCard'
import ModuleState from '../../inscriptions/components/ModuleState'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import { formatDate, formatNumber } from '../../inscriptions/utils/data'
import {
  getAnneeScolairePayload,
  normalizeAnneeScolaireForm,
  unwrapAnneeScolaire,
  validateAnneeScolaireForm,
} from '../utils/anneeScolaire'

const AnneeScolaireDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [anneeScolaire, setAnneeScolaire] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editForm, setEditForm] = useState(normalizeAnneeScolaireForm())
  const [editErrors, setEditErrors] = useState({})

  const loadAnneeScolaire = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const payload = await getAnneeScolaire(id)
      setAnneeScolaire(unwrapAnneeScolaire(payload))
    } catch (error) {
      setLoadError(error.message || 'Impossible de charger cette annee scolaire.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    getAnneeScolaire(id)
      .then((payload) => {
        if (!isCancelled) {
          setAnneeScolaire(unwrapAnneeScolaire(payload))
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setLoadError(error.message || 'Impossible de charger cette annee scolaire.')
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
    setEditForm(normalizeAnneeScolaireForm(anneeScolaire))
    setEditErrors({})
    setFeedback({ type: '', message: '' })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditForm(normalizeAnneeScolaireForm(anneeScolaire))
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

  const handleSave = async () => {
    setFeedback({ type: '', message: '' })

    const nextErrors = validateAnneeScolaireForm(editForm)
    setEditErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)

    try {
      const response = await updateAnneeScolaire(id, getAnneeScolairePayload(editForm))
      const updatedAnnee = unwrapAnneeScolaire(response)

      setAnneeScolaire(updatedAnnee)
      setEditForm(normalizeAnneeScolaireForm(updatedAnnee))
      setIsEditing(false)
      setFeedback({ type: 'success', message: 'Annee scolaire modifiee avec succes.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible d enregistrer cette annee scolaire.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = async () => {
    const isConfirmed = window.confirm(`Cloturer l annee scolaire "${anneeScolaire.designation}" ?`)

    if (!isConfirmed) {
      return
    }

    setFeedback({ type: '', message: '' })
    setIsClosing(true)

    try {
      const response = await cloturerAnneeScolaire(id)
      setAnneeScolaire(unwrapAnneeScolaire(response))
      setFeedback({ type: 'success', message: 'Annee scolaire cloturee avec succes.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de cloturer cette annee scolaire.' })
    } finally {
      setIsClosing(false)
    }
  }

  const handleDelete = async () => {
    const isConfirmed = window.confirm(`Supprimer l annee scolaire "${anneeScolaire.designation}" ? Cette action est irreversible.`)

    if (!isConfirmed) {
      return
    }

    setFeedback({ type: '', message: '' })
    setIsDeleting(true)

    try {
      await deleteAnneeScolaire(id)
      navigate('/annees-scolaires', {
        replace: true,
        state: { successMessage: 'Annee scolaire supprimee avec succes.' },
      })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de supprimer cette annee scolaire.' })
    } finally {
      setIsDeleting(false)
    }
  }

  const isActionPending = isSaving || isClosing || isDeleting
  const isActive = anneeScolaire?.statut === 'ACTIF'

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/annees-scolaires' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux annees scolaires
          </Link>
          <h1>Detail de l annee scolaire #{id}</h1>
          <p className='inscription-page-description'>
            Consultez les informations, modifiez les montants et cloturez l annee si necessaire.
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

      {isLoading && <div className='inscription-loading'>Chargement de l annee scolaire...</div>}

      {!isLoading && loadError && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={loadError}
          actionLabel='Reessayer'
          onAction={loadAnneeScolaire}
        />
      )}

      {!isLoading && !loadError && anneeScolaire && (
        <div className='detail-page-stack'>
          <DetailSummaryCard
            icon={<CalendarRange size={34} aria-hidden='true' />}
            title={anneeScolaire.designation}
            subtitle={`Annee scolaire #${anneeScolaire.id}`}
            meta={`Budget : ${formatNumber(anneeScolaire.budget)} - Frais : ${formatNumber(anneeScolaire.frais)}`}
            badge={<StatusBadge value={anneeScolaire.statut} />}
          />

          <DetailSection
            title='Informations de l annee scolaire'
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
                      onClick={handleSave}
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
            <DetailField label='Reference' value={`#${anneeScolaire.id}`} />
            {isEditing
              ? (
                <>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Designation</dt>
                    <dd>
                      <Input
                        id='designation'
                        type='text'
                        value={editForm.designation}
                        error={editErrors.designation}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Frais</dt>
                    <dd>
                      <Input
                        id='frais'
                        type='number'
                        min='0'
                        step='0.01'
                        value={editForm.frais}
                        error={editErrors.frais}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Budget</dt>
                    <dd>
                      <Input
                        id='budget'
                        type='number'
                        min='0'
                        step='0.01'
                        value={editForm.budget}
                        error={editErrors.budget}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                </>
                )
              : (
                <>
                  <DetailField label='Designation' value={anneeScolaire.designation} />
                  <DetailField label='Frais' value={formatNumber(anneeScolaire.frais)} />
                  <DetailField label='Budget' value={formatNumber(anneeScolaire.budget)} />
                </>
                )}
            <DetailField label='Statut' value={anneeScolaire.statut} />
          </DetailSection>

          <DetailSection
            title='Suivi de l annee scolaire'
            actions={(
              <>
                {isActive && (
                  <Button
                    type='button'
                    variant='ghost'
                    label={isClosing ? 'Cloture...' : 'Cloturer'}
                    icon={<Archive size={16} />}
                    loading={isClosing}
                    disabled={isDeleting || isEditing}
                    onClick={handleClose}
                    className='inscription-action annee-close-action'
                  />
                )}
                <Button
                  type='button'
                  variant='ghost'
                  label={isDeleting ? 'Suppression...' : 'Supprimer'}
                  icon={<Trash2 size={16} />}
                  loading={isDeleting}
                  disabled={isClosing || isEditing}
                  onClick={handleDelete}
                  className='inscription-action classe-delete-action'
                />
              </>
            )}
          >
            <DetailField label='Date de creation' value={formatDate(anneeScolaire.created_at)} />
            <DetailField label='Derniere modification' value={formatDate(anneeScolaire.updated_at)} />
          </DetailSection>
        </div>
      )}
    </section>
  )
}

export default AnneeScolaireDetailPage
