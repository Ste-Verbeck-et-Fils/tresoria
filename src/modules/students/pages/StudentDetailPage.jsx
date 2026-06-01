import React, { useEffect, useState } from 'react'
import { ArrowLeft, GraduationCap, PencilLine, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import DetailField from '../../inscriptions/components/DetailField'
import DetailSection from '../../inscriptions/components/DetailSection'
import DetailSummaryCard from '../../inscriptions/components/DetailSummaryCard'
import ModuleState from '../../inscriptions/components/ModuleState'
import { formatDate, getParentName, getStudentName, normalizeCollection } from '../../inscriptions/utils/data'
import SelectField from '../../inscriptions/components/SelectField'
import {
  deleteStudent,
  getStudent,
  getStudentAdresses,
  getStudentParents,
  updateStudent,
} from '../../../services/studentService'
import StudentAdresseManager from '../components/StudentAdresseManager'
import {
  getStudentParent,
  getStudentPayload,
  normalizeStudentForm,
  SEXE_OPTIONS,
  unwrapStudent,
  validateStudentForm,
} from '../utils/student'

const StudentDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [parents, setParents] = useState([])
  const [adresses, setAdresses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editForm, setEditForm] = useState(normalizeStudentForm())
  const [editErrors, setEditErrors] = useState({})

  const loadStudentData = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const [studentPayload, adressesPayload, parentsPayload] = await Promise.all([
        getStudent(id),
        getStudentAdresses(id),
        getStudentParents(),
      ])

      setStudent(unwrapStudent(studentPayload))
      setAdresses(normalizeCollection(adressesPayload))
      setParents(normalizeCollection(parentsPayload))
    } catch (error) {
      setLoadError(error.message || 'Impossible de charger cet eleve.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAdresses = async () => {
    const payload = await getStudentAdresses(id)
    setAdresses(normalizeCollection(payload))
  }

  useEffect(() => {
    let isCancelled = false

    Promise.all([
      getStudent(id),
      getStudentAdresses(id),
      getStudentParents(),
    ])
      .then(([studentPayload, adressesPayload, parentsPayload]) => {
        if (!isCancelled) {
          setStudent(unwrapStudent(studentPayload))
          setAdresses(normalizeCollection(adressesPayload))
          setParents(normalizeCollection(parentsPayload))
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setLoadError(error.message || 'Impossible de charger cet eleve.')
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
    setEditForm(normalizeStudentForm(student))
    setEditErrors({})
    setFeedback({ type: '', message: '' })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditForm(normalizeStudentForm(student))
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

    const nextErrors = validateStudentForm(editForm)
    setEditErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)

    try {
      const payload = await updateStudent(id, getStudentPayload(editForm))
      const updatedStudent = unwrapStudent(payload)

      setStudent(updatedStudent)
      setEditForm(normalizeStudentForm(updatedStudent))
      setIsEditing(false)
      setFeedback({ type: 'success', message: 'Eleve modifie avec succes.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible d enregistrer cet eleve.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    const isConfirmed = window.confirm(`Supprimer l eleve "${getStudentName(student)}" ? Cette action est irreversible.`)

    if (!isConfirmed) {
      return
    }

    setFeedback({ type: '', message: '' })
    setIsDeleting(true)

    try {
      await deleteStudent(id)
      navigate('/students', {
        replace: true,
        state: { successMessage: 'Eleve supprime avec succes.' },
      })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible de supprimer cet eleve.' })
    } finally {
      setIsDeleting(false)
    }
  }

  const pere = getStudentParent(student, 'pere', parents)
  const mere = getStudentParent(student, 'mere', parents)
  const parentOptions = parents.map((parent) => ({
    value: parent.id,
    label: `${getParentName(parent)}${parent.phone ? ` - ${parent.phone}` : ''}`,
  }))

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/students' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux eleves
          </Link>
          <h1>Detail de l eleve #{id}</h1>
          <p className='inscription-page-description'>
            Consultez l eleve, ses parents et ses adresses puis mettez ses informations a jour.
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

      {isLoading && <div className='inscription-loading'>Chargement de l eleve...</div>}

      {!isLoading && loadError && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={loadError}
          actionLabel='Reessayer'
          onAction={loadStudentData}
        />
      )}

      {!isLoading && !loadError && student && (
        <div className='detail-page-stack'>
          <DetailSummaryCard
            icon={<GraduationCap size={36} aria-hidden='true' />}
            title={getStudentName(student)}
            subtitle={`Eleve #${student.id}`}
            meta={`${student.sexe || 'Sexe non renseigne'} - ${student.contact || 'Contact non renseigne'}`}
          />

          <DetailSection
            title='Informations de l eleve'
            actions={(
              isEditing
                ? (
                  <>
                    <Button type='button' variant='ghost' label='Annuler' disabled={isSaving} onClick={handleCancelEdit} className='inscription-action inscription-action--secondary' />
                    <Button type='button' variant='super' label={isSaving ? 'Enregistrement...' : 'Enregistrer'} loading={isSaving} onClick={handleSaveEdit} className='inscription-action inscription-action--primary' />
                  </>
                  )
                : (
                  <Button type='button' variant='ghost' label='Modifier' icon={<PencilLine size={16} />} disabled={isDeleting} onClick={handleStartEdit} className='inscription-action inscription-action--secondary' />
                  )
            )}
          >
            <DetailField label='Reference' value={`#${student.id}`} />
            {isEditing
              ? (
                <>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Nom</dt><dd><Input id='nom' type='text' value={editForm.nom} error={editErrors.nom} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Postnom</dt><dd><Input id='postnom' type='text' value={editForm.postnom} error={editErrors.postnom} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Prenom</dt><dd><Input id='prenom' type='text' value={editForm.prenom} error={editErrors.prenom} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Sexe</dt><dd><SelectField id='sexe' label='' value={editForm.sexe} options={SEXE_OPTIONS} placeholder='Selectionner le sexe' error={editErrors.sexe} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Lieu de naissance</dt><dd><Input id='lieu_naissance' type='text' value={editForm.lieu_naissance} error={editErrors.lieu_naissance} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Date de naissance</dt><dd><Input id='date_naissance' type='date' value={editForm.date_naissance} error={editErrors.date_naissance} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Contact</dt><dd><Input id='contact' type='tel' value={editForm.contact} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Pere</dt><dd><SelectField id='pere_id' label='' value={editForm.pere_id} options={parentOptions} placeholder='Selectionner le pere' disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Mere</dt><dd><SelectField id='mere_id' label='' value={editForm.mere_id} options={parentOptions} placeholder='Selectionner la mere' error={editErrors.mere_id} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Province d origine</dt><dd><Input id='province_origine' type='text' value={editForm.province_origine} error={editErrors.province_origine} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Territoire d origine</dt><dd><Input id='territoire_origine' type='text' value={editForm.territoire_origine} error={editErrors.territoire_origine} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Collectivite d origine</dt><dd><Input id='collectivite_origine' type='text' value={editForm.collectivite_origine} error={editErrors.collectivite_origine} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Groupement d origine</dt><dd><Input id='groupement_origine' type='text' value={editForm.groupement_origine} error={editErrors.groupement_origine} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                  <div className='inscription-detail-field inscription-detail-field--editing'><dt>Localite d origine</dt><dd><Input id='localite_origine' type='text' value={editForm.localite_origine} error={editErrors.localite_origine} disabled={isSaving} onChange={handleEditChange} /></dd></div>
                </>
                )
              : (
                <>
                  <DetailField label='Nom' value={student.nom} />
                  <DetailField label='Postnom' value={student.postnom} />
                  <DetailField label='Prenom' value={student.prenom} />
                  <DetailField label='Sexe' value={student.sexe} />
                  <DetailField label='Lieu de naissance' value={student.lieu_naissance} />
                  <DetailField label='Date de naissance' value={formatDate(student.date_naissance)} />
                  <DetailField label='Contact' value={student.contact} />
                  <DetailField label='Pere' value={getParentName(pere)} />
                  <DetailField label='Mere' value={getParentName(mere)} />
                  <DetailField label='Province d origine' value={student.province_origine} />
                  <DetailField label='Territoire d origine' value={student.territoire_origine} />
                  <DetailField label='Collectivite d origine' value={student.collectivite_origine} />
                  <DetailField label='Groupement d origine' value={student.groupement_origine} />
                  <DetailField label='Localite d origine' value={student.localite_origine} />
                </>
                )}
          </DetailSection>

          <StudentAdresseManager
            studentId={id}
            adresses={adresses}
            loadAdresses={loadAdresses}
            disabled={isEditing || isDeleting}
          />

          <DetailSection
            title='Actions sensibles'
            actions={(
              <Button type='button' variant='ghost' label={isDeleting ? 'Suppression...' : 'Supprimer'} icon={<Trash2 size={16} />} loading={isDeleting} disabled={isEditing} onClick={handleDelete} className='inscription-action classe-delete-action' />
            )}
          >
            <DetailField label='Regle de suppression' value='La suppression peut etre refusee si l eleve possede une inscription.' />
          </DetailSection>
        </div>
      )}
    </section>
  )
}

export default StudentDetailPage
