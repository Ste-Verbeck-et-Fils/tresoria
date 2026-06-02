import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, MapPin, PencilLine, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import DetailField from '../../inscriptions/components/DetailField'
import DetailSection from '../../inscriptions/components/DetailSection'
import DetailSummaryCard from '../../inscriptions/components/DetailSummaryCard'
import ModuleState from '../../inscriptions/components/ModuleState'
import SelectField from '../../inscriptions/components/SelectField'
import { formatDate, normalizeCollection } from '../../inscriptions/utils/data'
import {
  getOwnedAdressePayload,
  normalizeOwnedAdresseForm,
  unwrapAdresse,
  validateOwnedAdresseForm,
} from '../../inscriptions/utils/adresse'
import {
  deleteAdresse,
  getAdresse,
  updateAdresse,
} from '../../../services/adresseService'
import { getParents } from '../../../services/parentService'
import { getStudents } from '../../../services/studentService'
import {
  getAdresseOwnerLabel,
  getAdresseOwnerName,
  getAdresseOwnerType,
  getAdresseText,
  getOwnerOptions,
  OWNER_TYPE_OPTIONS,
} from '../utils/adresse'

const AdresseDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [adresse, setAdresse] = useState(null)
  const [parents, setParents] = useState([])
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOwners, setIsLoadingOwners] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [ownersError, setOwnersError] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [ownerType, setOwnerType] = useState('')
  const [editForm, setEditForm] = useState(normalizeOwnedAdresseForm())
  const [editErrors, setEditErrors] = useState({})

  const loadAdresse = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const payload = await getAdresse(id)
      setAdresse(unwrapAdresse(payload))
    } catch (error) {
      setLoadError(error.message || 'Impossible de charger cette adresse.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  const loadOwners = useCallback(async () => {
    setIsLoadingOwners(true)
    setOwnersError('')

    const [parentsResult, studentsResult] = await Promise.allSettled([
      getParents(),
      getStudents(),
    ])

    if (parentsResult.status === 'fulfilled') {
      setParents(normalizeCollection(parentsResult.value))
    }

    if (studentsResult.status === 'fulfilled') {
      setStudents(normalizeCollection(studentsResult.value))
    }

    if (parentsResult.status === 'rejected' || studentsResult.status === 'rejected') {
      setOwnersError('Certains proprietaires sont indisponibles. Rechargez les listes avant de modifier l adresse.')
    }

    setIsLoadingOwners(false)
  }, [])

  useEffect(() => {
    let isCancelled = false

    getAdresse(id)
      .then((payload) => {
        if (!isCancelled) {
          setAdresse(unwrapAdresse(payload))
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setLoadError(error.message || 'Impossible de charger cette adresse.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    Promise.allSettled([
      getParents(),
      getStudents(),
    ]).then(([parentsResult, studentsResult]) => {
      if (isCancelled) {
        return
      }

      if (parentsResult.status === 'fulfilled') {
        setParents(normalizeCollection(parentsResult.value))
      }

      if (studentsResult.status === 'fulfilled') {
        setStudents(normalizeCollection(studentsResult.value))
      }

      if (parentsResult.status === 'rejected' || studentsResult.status === 'rejected') {
        setOwnersError('Certains proprietaires sont indisponibles. Rechargez les listes avant de modifier l adresse.')
      }

      setIsLoadingOwners(false)
    })

    return () => {
      isCancelled = true
    }
  }, [id])

  const ownerOptions = useMemo(
    () => getOwnerOptions(ownerType, parents, students),
    [ownerType, parents, students]
  )

  const clearEditError = (field) => {
    if (editErrors[field]) {
      setEditErrors((currentErrors) => ({ ...currentErrors, [field]: '' }))
    }
  }

  const handleStartEdit = () => {
    setOwnerType(getAdresseOwnerType(adresse))
    setEditForm(normalizeOwnedAdresseForm(adresse))
    setEditErrors({})
    setFeedback({ type: '', message: '' })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setOwnerType(getAdresseOwnerType(adresse))
    setEditForm(normalizeOwnedAdresseForm(adresse))
    setEditErrors({})
    setFeedback({ type: '', message: '' })
    setIsEditing(false)
  }

  const handleOwnerTypeChange = (event) => {
    setOwnerType(event.target.value)
    setEditForm((currentForm) => ({ ...currentForm, parent_id: '', student_id: '' }))
    clearEditError('owner_id')
  }

  const handleOwnerChange = (event) => {
    const ownerKey = ownerType === 'parent' ? 'parent_id' : 'student_id'
    const otherOwnerKey = ownerType === 'parent' ? 'student_id' : 'parent_id'

    setEditForm((currentForm) => ({
      ...currentForm,
      [ownerKey]: event.target.value,
      [otherOwnerKey]: '',
    }))
    clearEditError('owner_id')
  }

  const handleEditChange = (event) => {
    const { id: fieldId, value } = event.target
    setEditForm((currentForm) => ({ ...currentForm, [fieldId]: value }))
    clearEditError(fieldId)
  }

  const handleSaveEdit = async () => {
    setFeedback({ type: '', message: '' })

    const nextErrors = validateOwnedAdresseForm(editForm)
    setEditErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)

    try {
      const payload = await updateAdresse(id, getOwnedAdressePayload(editForm))
      const updatedAdresse = unwrapAdresse(payload)

      if (updatedAdresse?.id) {
        setAdresse(updatedAdresse)
      } else {
        const refreshedPayload = await getAdresse(id)
        setAdresse(unwrapAdresse(refreshedPayload))
      }

      setIsEditing(false)
      setFeedback({ type: 'success', message: 'Adresse modifiee avec succes.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible d enregistrer cette adresse.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    const isConfirmed = window.confirm(`Supprimer l adresse #${id} ? Cette action est irreversible.`)

    if (!isConfirmed) {
      return
    }

    setFeedback({ type: '', message: '' })
    setIsDeleting(true)

    try {
      await deleteAdresse(id)
      navigate('/adresses', {
        replace: true,
        state: { successMessage: 'Adresse supprimee avec succes.' },
      })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de supprimer cette adresse.' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/adresses' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux adresses
          </Link>
          <h1>Detail de l adresse #{id}</h1>
          <p className='inscription-page-description'>
            Consultez le proprietaire et mettez a jour la localisation de l adresse.
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

      {!isLoadingOwners && ownersError && (
        <ModuleState
          type='warning'
          title='Proprietaires indisponibles'
          message={ownersError}
          actionLabel='Reessayer'
          onAction={loadOwners}
        />
      )}

      {isLoading && <div className='inscription-loading'>Chargement de l adresse...</div>}

      {!isLoading && loadError && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={loadError}
          actionLabel='Reessayer'
          onAction={loadAdresse}
        />
      )}

      {!isLoading && !loadError && adresse && (
        <div className='detail-page-stack'>
          <DetailSummaryCard
            icon={<MapPin size={34} aria-hidden='true' />}
            title={`Adresse #${adresse.id}`}
            subtitle={getAdresseOwnerName(adresse, parents, students)}
            meta={getAdresseText(adresse)}
          />

          <DetailSection
            title='Informations de l adresse'
            actions={(
              isEditing
                ? (
                  <>
                    <Button type='button' variant='ghost' label='Annuler' disabled={isSaving} onClick={handleCancelEdit} className='inscription-action inscription-action--secondary' />
                    <Button type='button' variant='super' label={isSaving ? 'Enregistrement...' : 'Enregistrer'} loading={isSaving} onClick={handleSaveEdit} className='inscription-action inscription-action--primary' />
                  </>
                  )
                : (
                  <Button type='button' variant='ghost' label='Modifier' icon={<PencilLine size={16} />} disabled={isDeleting || isLoadingOwners || Boolean(ownersError)} onClick={handleStartEdit} className='inscription-action inscription-action--secondary' />
                  )
            )}
          >
            <DetailField label='Reference' value={`#${adresse.id}`} />
            {isEditing
              ? (
                <>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Type de proprietaire</dt>
                    <dd><SelectField id='owner_type' label='' value={ownerType} options={OWNER_TYPE_OPTIONS} placeholder='Selectionner un type' error={!ownerType ? editErrors.owner_id : ''} disabled={isSaving} onChange={handleOwnerTypeChange} /></dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'>
                    <dt>Proprietaire</dt>
                    <dd><SelectField id='owner_id' label='' value={ownerType === 'parent' ? editForm.parent_id : editForm.student_id} options={ownerOptions} placeholder={ownerType === 'parent' ? 'Selectionner un parent' : ownerType === 'student' ? 'Selectionner un eleve' : 'Selectionner un type'} error={editErrors.owner_id} disabled={isSaving || !ownerType} onChange={handleOwnerChange} /></dd>
                  </div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Commune</dt><dd><Input id='commune' type='text' value={editForm.commune} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Quartier</dt><dd><Input id='quartier' type='text' value={editForm.quartier} error={editErrors.quartier} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Avenue</dt><dd><Input id='avenue' type='text' value={editForm.avenue} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Numero</dt><dd><Input id='numero' type='text' value={editForm.numero} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                </>
                )
              : (
                <>
                  <DetailField label='Type de proprietaire' value={getAdresseOwnerLabel(adresse)} />
                  <DetailField label='Proprietaire' value={getAdresseOwnerName(adresse, parents, students)} />
                  <DetailField label='Commune' value={adresse.commune} />
                  <DetailField label='Quartier' value={adresse.quartier} />
                  <DetailField label='Avenue' value={adresse.avenue} />
                  <DetailField label='Numero' value={adresse.numero} />
                </>
                )}
          </DetailSection>

          <DetailSection
            title='Suivi de l adresse'
            actions={(
              <Button type='button' variant='ghost' label={isDeleting ? 'Suppression...' : 'Supprimer'} icon={<Trash2 size={16} />} loading={isDeleting} disabled={isEditing} onClick={handleDelete} className='inscription-action classe-delete-action' />
            )}
          >
            <DetailField label='Date de creation' value={formatDate(adresse.created_at)} />
            <DetailField label='Derniere modification' value={formatDate(adresse.updated_at)} />
          </DetailSection>
        </div>
      )}
    </section>
  )
}

export default AdresseDetailPage
