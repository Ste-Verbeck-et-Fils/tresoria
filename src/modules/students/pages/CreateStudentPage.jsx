import React, { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import ModuleState from '../../inscriptions/components/ModuleState'
import SelectField from '../../inscriptions/components/SelectField'
import { normalizeCollection, getParentName } from '../../inscriptions/utils/data'
import {
  getStudentAdressePayload,
  normalizeAdresseForm,
  validateAdresseForm,
} from '../../inscriptions/utils/adresse'
import {
  createAdresse,
  createStudent,
} from '../../../services/studentService'
import { getParents, searchParentsByPhone } from '../../../services/parentService'
import QuickParentForm from '../components/QuickParentForm'
import {
  getStudentPayload,
  normalizeStudentForm,
  SEXE_OPTIONS,
  unwrapStudent,
  validateStudentForm,
} from '../utils/student'

const CreateStudentPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(normalizeStudentForm())
  const [adresseForm, setAdresseForm] = useState(normalizeAdresseForm())
  const [withAdresse, setWithAdresse] = useState(false)
  const [parents, setParents] = useState([])
  const [isLoadingParents, setIsLoadingParents] = useState(true)
  const [parentsError, setParentsError] = useState('')
  const [parentPhoneSearch, setParentPhoneSearch] = useState('')
  const [isSearchingParent, setIsSearchingParent] = useState(false)
  const [errors, setErrors] = useState({})
  const [adresseErrors, setAdresseErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [quickParentRole, setQuickParentRole] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadParents = async () => {
    setIsLoadingParents(true)
    setParentsError('')

    try {
      const payload = await getParents()
      setParents(normalizeCollection(payload))
    } catch (error) {
      setParentsError(error.message || 'Impossible de charger les parents.')
    } finally {
      setIsLoadingParents(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    getParents()
      .then((payload) => {
        if (!isCancelled) {
          setParents(normalizeCollection(payload))
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setParentsError(error.message || 'Impossible de charger les parents.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingParents(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [id]: value }))

    if (errors[id]) {
      setErrors((currentErrors) => ({ ...currentErrors, [id]: '' }))
    }
  }

  const handleAdresseChange = (event) => {
    const { id, value } = event.target
    setAdresseForm((currentForm) => ({ ...currentForm, [id]: value }))

    if (adresseErrors[id]) {
      setAdresseErrors((currentErrors) => ({ ...currentErrors, [id]: '' }))
    }
  }

  const handleQuickParentCreated = (parent) => {
    if (!parent?.id) {
      setFeedback('Impossible de selectionner le parent cree.')
      return
    }

    setParents((currentParents) => [
      ...currentParents.filter((item) => item.id !== parent.id),
      parent,
    ])
    setForm((currentForm) => ({ ...currentForm, [quickParentRole]: String(parent.id) }))
    setQuickParentRole('')
  }

  const handleParentSearch = async () => {
    setIsSearchingParent(true)
    setParentsError('')

    try {
      const payload = parentPhoneSearch.trim()
        ? await searchParentsByPhone(parentPhoneSearch)
        : await getParents()

      setParents(normalizeCollection(payload))
    } catch (error) {
      setParentsError(error.message || 'Impossible de rechercher ce parent.')
    } finally {
      setIsSearchingParent(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')

    const nextErrors = validateStudentForm(form)
    const nextAdresseErrors = withAdresse ? validateAdresseForm(adresseForm) : {}

    setErrors(nextErrors)
    setAdresseErrors(nextAdresseErrors)

    if (Object.keys(nextErrors).length > 0 || Object.keys(nextAdresseErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await createStudent(getStudentPayload(form))
      const student = unwrapStudent(payload)

      if (withAdresse && student?.id) {
        try {
          await createAdresse(getStudentAdressePayload(adresseForm, student.id))
        } catch (adresseError) {
          navigate(`/students/${student.id}`, {
            replace: true,
            state: {
              warningMessage: adresseError.message || 'L eleve a ete cree, mais son adresse n a pas pu etre ajoutee.',
            },
          })
          return
        }
      }

      navigate(student?.id ? `/students/${student.id}` : '/students', {
        replace: true,
        state: { successMessage: 'Eleve cree avec succes.' },
      })
    } catch (error) {
      setFeedback(error.message || 'Impossible de creer cet eleve.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <h1>Nouvel eleve</h1>
          <p className='inscription-page-description'>
            Renseignez l identite de l eleve, liez ses parents et ajoutez son adresse si necessaire.
          </p>
        </div>
      </header>

      {isLoadingParents && <div className='inscription-loading'>Chargement des parents...</div>}

      {parentsError && (
        <ModuleState
          type='warning'
          title='Parents indisponibles'
          message={parentsError}
          actionLabel='Reessayer'
          onAction={loadParents}
        />
      )}

      {!isLoadingParents && (
        <form className='inscription-form-panel student-create-form' onSubmit={handleSubmit}>
          {feedback && (
            <Feedback
              type='error'
              title='Echec de l enregistrement'
              message={feedback}
              onClose={() => setFeedback('')}
            />
          )}

          <section className='student-form-section'>
            <h2>Identite de l eleve</h2>
            <div className='inscription-form-grid'>
              <Input id='nom' type='text' label='Nom' placeholder='Nom' value={form.nom} error={errors.nom} disabled={isSubmitting} onChange={handleChange} />
              <Input id='postnom' type='text' label='Postnom' placeholder='Postnom' value={form.postnom} error={errors.postnom} disabled={isSubmitting} onChange={handleChange} />
              <Input id='prenom' type='text' label='Prenom' placeholder='Prenom' value={form.prenom} error={errors.prenom} disabled={isSubmitting} onChange={handleChange} />
              <SelectField id='sexe' label='Sexe' value={form.sexe} options={SEXE_OPTIONS} placeholder='Selectionner le sexe' error={errors.sexe} disabled={isSubmitting} onChange={handleChange} />
              <Input id='lieu_naissance' type='text' label='Lieu de naissance' placeholder='Lieu de naissance' value={form.lieu_naissance} error={errors.lieu_naissance} disabled={isSubmitting} onChange={handleChange} />
              <Input id='date_naissance' type='date' label='Date de naissance' placeholder='Date de naissance' value={form.date_naissance} error={errors.date_naissance} disabled={isSubmitting} onChange={handleChange} />
              <Input id='contact' type='tel' label='Contact (optionnel)' placeholder='Contact (optionnel)' value={form.contact} disabled={isSubmitting} onChange={handleChange} />
            </div>
          </section>

          <section className='student-form-section'>
            <h2>Parents</h2>
            <Input
              id='student-parent-search'
              type='search'
              variant='searchbox'
              placeholder='Rechercher un parent par telephone'
              value={parentPhoneSearch}
              icon={<Search size={18} />}
              disabled={isSubmitting || isSearchingParent}
              onChange={(event) => setParentPhoneSearch(event.target.value)}
              onSearch={handleParentSearch}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleParentSearch()
                }
              }}
              className='student-parent-search'
            />
            <div className='student-parent-grid'>
              <div className='student-parent-picker'>
                <SelectField id='pere_id' label='Pere (optionnel)' value={form.pere_id} options={parentOptions} placeholder='Selectionner le pere' disabled={isSubmitting} onChange={handleChange} />
                <Button type='button' variant='ghost' label='Creer le pere' icon={<Plus size={15} />} disabled={isSubmitting} onClick={() => setQuickParentRole('pere_id')} className='inscription-action inscription-action--secondary' />
              </div>
              <div className='student-parent-picker'>
                <SelectField id='mere_id' label='Mere (optionnel)' value={form.mere_id} options={parentOptions} placeholder='Selectionner la mere' error={errors.mere_id} disabled={isSubmitting} onChange={handleChange} />
                <Button type='button' variant='ghost' label='Creer la mere' icon={<Plus size={15} />} disabled={isSubmitting} onClick={() => setQuickParentRole('mere_id')} className='inscription-action inscription-action--secondary' />
              </div>
            </div>

            {quickParentRole && (
              <QuickParentForm
                parentRole={quickParentRole}
                onCancel={() => setQuickParentRole('')}
                onCreated={handleQuickParentCreated}
              />
            )}
          </section>

          <section className='student-form-section'>
            <h2>Origine</h2>
            <div className='inscription-form-grid'>
              <Input id='province_origine' type='text' label='Province d origine' placeholder='Province d origine' value={form.province_origine} error={errors.province_origine} disabled={isSubmitting} onChange={handleChange} />
              <Input id='territoire_origine' type='text' label='Territoire d origine' placeholder='Territoire d origine' value={form.territoire_origine} error={errors.territoire_origine} disabled={isSubmitting} onChange={handleChange} />
              <Input id='collectivite_origine' type='text' label='Collectivite d origine' placeholder='Collectivite d origine' value={form.collectivite_origine} error={errors.collectivite_origine} disabled={isSubmitting} onChange={handleChange} />
              <Input id='groupement_origine' type='text' label='Groupement d origine' placeholder='Groupement d origine' value={form.groupement_origine} error={errors.groupement_origine} disabled={isSubmitting} onChange={handleChange} />
              <Input id='localite_origine' type='text' label='Localite d origine' placeholder='Localite d origine' value={form.localite_origine} error={errors.localite_origine} disabled={isSubmitting} onChange={handleChange} />
            </div>
          </section>

          <label className='parent-address-toggle'>
            <input type='checkbox' checked={withAdresse} disabled={isSubmitting} onChange={(event) => setWithAdresse(event.target.checked)} />
            Ajouter une adresse maintenant
          </label>

          {withAdresse && (
            <section className='parent-address-create-panel'>
              <h2>Adresse de l eleve</h2>
              <div className='inscription-form-grid'>
                <Input id='commune' type='text' label='Commune' placeholder='Commune' value={adresseForm.commune} disabled={isSubmitting} onChange={handleAdresseChange} />
                <Input id='quartier' type='text' label='Quartier' placeholder='Quartier' value={adresseForm.quartier} error={adresseErrors.quartier} disabled={isSubmitting} onChange={handleAdresseChange} />
                <Input id='avenue' type='text' label='Avenue' placeholder='Avenue' value={adresseForm.avenue} disabled={isSubmitting} onChange={handleAdresseChange} />
                <Input id='numero' type='text' label='Numero' placeholder='Numero' value={adresseForm.numero} disabled={isSubmitting} onChange={handleAdresseChange} />
              </div>
            </section>
          )}

          <div className='inscription-form-actions'>
            <Button type='button' variant='ghost' label='Annuler' disabled={isSubmitting} onClick={() => navigate('/students')} className='inscription-action inscription-action--secondary' />
            <Button type='submit' variant='super' label={isSubmitting ? 'Enregistrement...' : 'Enregistrer'} loading={isSubmitting} className='inscription-action inscription-action--primary' />
          </div>
        </form>
      )}
    </section>
  )
}

export default CreateStudentPage
