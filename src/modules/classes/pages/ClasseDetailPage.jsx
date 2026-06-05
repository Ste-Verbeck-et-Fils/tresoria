import Loader from '../../../components/ui/Loader'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, PencilLine, School, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import { deleteClasse, getClasse, updateClasse } from '../../../services/classeService'
import DetailField from '../../inscriptions/components/DetailField'
import DetailSection from '../../inscriptions/components/DetailSection'
import DetailSummaryCard from '../../inscriptions/components/DetailSummaryCard'
import ModuleState from '../../inscriptions/components/ModuleState'
import { formatDate, formatNumber } from '../../inscriptions/utils/data'

const normalizeForm = (classe = {}) => ({
  designation: classe.designation || '',
  capacite: classe.capacite ?? '',
  responsable: classe.responsable || '',
})

const ClasseDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [classe, setClasse] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState(normalizeForm())
  const [editErrors, setEditErrors] = useState({})
  const [editFeedback, setEditFeedback] = useState('')

  const loadClasse = async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await getClasse(id)
      setClasse(payload.classe || payload.data || payload)
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger cette classe.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    getClasse(id)
      .then((payload) => {
        if (!isCancelled) {
          setClasse(payload.classe || payload.data || payload)
        }
      })
      .catch((loadError) => {
        if (!isCancelled) {
          setError(loadError.message || 'Impossible de charger cette classe.')
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

  const handleDelete = async () => {
    const isConfirmed = window.confirm(`Supprimer la classe "${classe.designation}" ? Cette action est irreversible.`)

    if (!isConfirmed) {
      return
    }

    setDeleteError('')
    setIsDeleting(true)

    try {
      await deleteClasse(id)
      navigate('/classes', {
        replace: true,
        state: { successMessage: 'Classe supprimee avec succes.' },
      })
    } catch (deleteRequestError) {
      setDeleteError(deleteRequestError.message || 'Impossible de supprimer cette classe.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStartEdit = () => {
    setEditForm(normalizeForm(classe))
    setEditErrors({})
    setEditFeedback('')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditForm(normalizeForm(classe))
    setEditErrors({})
    setEditFeedback('')
    setIsEditing(false)
  }

  const handleEditChange = (event) => {
    const { id: fieldId, value } = event.target
    setEditForm((currentForm) => ({ ...currentForm, [fieldId]: value }))

    if (editErrors[fieldId]) {
      setEditErrors((currentErrors) => ({ ...currentErrors, [fieldId]: '' }))
    }
  }

  const validateEditForm = () => {
    const nextErrors = {}
    const capacite = Number(editForm.capacite)

    if (!editForm.designation.trim()) {
      nextErrors.designation = 'La designation est obligatoire.'
    }

    if (editForm.capacite && (!Number.isInteger(capacite) || capacite <= 0)) {
      nextErrors.capacite = 'La capacite doit etre un nombre entier superieur a zero.'
    }

    setEditErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSaveEdit = async () => {
    setEditFeedback('')

    if (!validateEditForm()) {
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        designation: editForm.designation.trim(),
        capacite: editForm.capacite ? Number(editForm.capacite) : null,
        responsable: editForm.responsable.trim() || null,
      }
      const response = await updateClasse(id, payload)
      const updatedClasse = response.classe || response.data || response

      setClasse(updatedClasse)
      setEditForm(normalizeForm(updatedClasse))
      setIsEditing(false)
      setEditFeedback('Classe modifiee avec succes.')
    } catch (saveError) {
      setEditFeedback(saveError.message || 'Impossible d enregistrer cette classe.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/classes' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux classes
          </Link>

          <h1>Detail de la classe #{id}</h1>
          
        </div>
      </header>

      {location.state?.successMessage && (
        <Feedback type='success' message={location.state.successMessage} />
      )}

      {deleteError && (
        <Feedback
          type='error'
          title='Echec de la suppression'
          message={deleteError}
          onClose={() => setDeleteError('')}
        />
      )}

      {editFeedback && (
        <Feedback
          type={isEditing ? 'error' : 'success'}
          message={editFeedback}
          onClose={() => setEditFeedback('')}
        />
      )}

      {isLoading && <Loader message='Chargement de la classe...' />}

      {!isLoading && error && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={error}
          actionLabel='Reessayer'
          onAction={loadClasse}
        />
      )}

      {!isLoading && !error && classe && (
        <div className='detail-page-stack'>
          <DetailSummaryCard
            icon={<School size={34} aria-hidden='true' />}
            title={classe.designation}
            subtitle={`Classe #${classe.id}`}
            meta={classe.responsable || 'Responsable non renseigne'}
          />

          <DetailSection
            title='Informations de la classe'
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
                    disabled={isDeleting}
                    onClick={handleStartEdit}
                    className='inscription-action inscription-action--secondary'
                  />
                  )
            )}
          >
            <DetailField label='Reference' value={`#${classe.id}`} />
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
                    <dt>Capacite</dt>
                    <dd>
                      <Input
                        id='capacite'
                        type='number'
                        min='1'
                        value={editForm.capacite}
                        error={editErrors.capacite}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Responsable</dt>
                    <dd>
                      <Input
                        id='responsable'
                        type='text'
                        value={editForm.responsable}
                        disabled={isSaving}
                        onChange={handleEditChange}
                      />
                    </dd>
                  </div>
                </>
                )
              : (
                <>
                  <DetailField label='Designation' value={classe.designation} />
                  <DetailField label='Capacite' value={formatNumber(classe.capacite)} />
                  <DetailField label='Responsable' value={classe.responsable} />
                </>
                )}
          </DetailSection>

          <DetailSection
            title='Suivi de la classe'
            actions={(
              <Button
                type='button'
                variant='ghost'
                label={isDeleting ? 'Suppression...' : 'Supprimer'}
                icon={<Trash2 size={16} />}
                loading={isDeleting}
                onClick={handleDelete}
                className='inscription-action classe-delete-action'
              />
            )}
          >
            <DetailField label='Date de creation' value={formatDate(classe.created_at)} />
            <DetailField label='Derniere modification' value={formatDate(classe.updated_at)} />
          </DetailSection>
        </div>
      )}
    </section>
  )
}

export default ClasseDetailPage
