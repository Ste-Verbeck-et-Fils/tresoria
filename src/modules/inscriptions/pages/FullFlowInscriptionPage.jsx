import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarCheck2, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import {
  getAnneeScolaireActive,
  getAnneesScolaires,
} from '../../../services/anneeScolaireService'
import { getClasses } from '../../../services/classeService'
import { createFullFlowInscription } from '../../../services/inscriptionService'
import { unwrapAnneeScolaire } from '../../anneesScolaires/utils/anneeScolaire'
import DetailField from '../components/DetailField'
import FlowAdresseFields from '../components/FlowAdresseFields'
import FullFlowParentCard from '../components/FullFlowParentCard'
import ModuleState from '../components/ModuleState'
import SearchableSelectField from '../components/SearchableSelectField'
import StatusBadge from '../components/StatusBadge'
import {
  formatDate,
  getDesignation,
  getParentName,
  normalizeCollection,
  unwrapEntity,
} from '../utils/data'
import {
  createEmptyFlowStudent,
  FULL_FLOW_GENDER_OPTIONS,
  FULL_FLOW_STEPS,
  getFullFlowPayload,
  hasValidationErrors,
  validateFlowStudent,
} from '../utils/fullFlow'

const formatAdresse = (adresse) => {
  const firstAdresse = Array.isArray(adresse) ? adresse[0] : adresse

  return [firstAdresse?.avenue, firstAdresse?.quartier, firstAdresse?.commune]
    .filter(Boolean)
    .join(', ') || 'Non renseignee'
}

const FullFlowInscriptionPage = () => {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [pere, setPere] = useState(null)
  const [mere, setMere] = useState(null)
  const [student, setStudent] = useState(createEmptyFlowStudent)
  const [studentErrors, setStudentErrors] = useState({})
  const [school, setSchool] = useState({ class_id: '', annee_scolaire_id: '' })
  const [schoolErrors, setSchoolErrors] = useState({})
  const [classes, setClasses] = useState([])
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [activeAnnee, setActiveAnnee] = useState(null)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [activeError, setActiveError] = useState('')
  const [stepError, setStepError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const applyOptionsResults = useCallback((classesResult, anneesResult, activeResult) => {
    const nextClasses = classesResult.status === 'fulfilled'
      ? normalizeCollection(classesResult.value)
      : []
    const nextAnnees = anneesResult.status === 'fulfilled'
      ? normalizeCollection(anneesResult.value)
      : []
    const nextActiveAnnee = activeResult.status === 'fulfilled'
      ? unwrapAnneeScolaire(activeResult.value)
      : null

    setClasses(nextClasses)
    setAnneesScolaires(nextAnnees)
    setActiveAnnee(nextActiveAnnee)

    if (classesResult.status === 'rejected' || anneesResult.status === 'rejected') {
      setOptionsError('Impossible de charger les classes ou les annees scolaires.')
    }

    if (activeResult.status === 'rejected') {
      setActiveError('Impossible de charger automatiquement l annee scolaire active.')
    }

    if (nextActiveAnnee?.id) {
      setSchool((current) => (
        current.annee_scolaire_id
          ? current
          : { ...current, annee_scolaire_id: String(nextActiveAnnee.id) }
      ))
    }
  }, [])

  const loadOptions = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError('')
    setActiveError('')

    const results = await Promise.allSettled([
      getClasses(),
      getAnneesScolaires(),
      getAnneeScolaireActive(),
    ])

    applyOptionsResults(...results)
    setIsLoadingOptions(false)
  }, [applyOptionsResults])

  useEffect(() => {
    let isCancelled = false

    Promise.allSettled([
      getClasses(),
      getAnneesScolaires(),
      getAnneeScolaireActive(),
    ]).then((results) => {
      if (!isCancelled) {
        applyOptionsResults(...results)
        setIsLoadingOptions(false)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [applyOptionsResults])

  const classeOptions = useMemo(
    () => classes.map((classe) => ({
      value: classe.id,
      label: getDesignation(classe, `Classe #${classe.id}`),
      searchText: classe.responsable || '',
    })),
    [classes]
  )

  const anneeOptions = useMemo(
    () => anneesScolaires.map((annee) => ({
      value: annee.id,
      label: getDesignation(annee, `Annee #${annee.id}`),
      searchText: annee.statut || '',
    })),
    [anneesScolaires]
  )

  const selectedClasse = classes.find((classe) => String(classe.id) === String(school.class_id))
  const selectedAnnee = anneesScolaires.find(
    (annee) => String(annee.id) === String(school.annee_scolaire_id)
  )

  const updateStudent = (field, value) => {
    setStudent((current) => ({ ...current, [field]: value }))
    setStudentErrors((current) => ({ ...current, [field]: undefined }))
  }

  const updateStudentAdresse = (field, value) => {
    setStudent((current) => ({
      ...current,
      adresse: { ...current.adresse, [field]: value },
    }))
    setStudentErrors((current) => ({
      ...current,
      adresse: { ...current.adresse, [field]: undefined },
    }))
  }

  const updateSchool = (event) => {
    const { id, value } = event.target
    setSchool((current) => ({ ...current, [id]: value }))
    setSchoolErrors((current) => ({ ...current, [id]: undefined }))
  }

  const validateParentsStep = () => {
    if (pere?.id && mere?.id && Number(pere.id) === Number(mere.id)) {
      setStepError('Le pere et la mere doivent etre deux parents differents.')
      return false
    }

    setStepError('')
    return true
  }

  const validateStudentStep = () => {
    const nextErrors = validateFlowStudent(student)
    setStudentErrors(nextErrors)

    if (hasValidationErrors(nextErrors)) {
      setStepError('Completez les informations obligatoires de l eleve.')
      return false
    }

    setStepError('')
    return true
  }

  const validateSchoolStep = () => {
    const nextErrors = {}

    if (!school.class_id) {
      nextErrors.class_id = 'Selectionnez une classe.'
    }

    if (!school.annee_scolaire_id) {
      nextErrors.annee_scolaire_id = 'Selectionnez une annee scolaire.'
    }

    setSchoolErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      setStepError('Selectionnez une classe et une annee scolaire.')
      return false
    }

    setStepError('')
    return true
  }

  const validateCurrentStep = () => {
    if (stepIndex === 0) {
      return validateParentsStep()
    }

    if (stepIndex === 1) {
      return validateStudentStep()
    }

    return stepIndex === 2 ? validateSchoolStep() : true
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStepIndex((current) => Math.min(current + 1, FULL_FLOW_STEPS.length - 1))
    }
  }

  const previousStep = () => {
    setStepError('')
    setSubmitError('')
    setStepIndex((current) => Math.max(current - 1, 0))
  }

  const handleSubmit = async () => {
    setSubmitError('')

    if (!validateParentsStep() || !validateStudentStep() || !validateSchoolStep()) {
      setSubmitError('Certaines informations du parcours doivent etre corrigees.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await createFullFlowInscription(getFullFlowPayload({
        pere,
        mere,
        student,
        classId: school.class_id,
        anneeScolaireId: school.annee_scolaire_id,
      }))
      const inscription = unwrapEntity(payload, 'inscription')

      navigate(inscription.id ? `/inscriptions/${inscription.id}` : '/inscriptions', {
        replace: true,
        state: { successMessage: 'Inscription complete creee avec succes.' },
      })
    } catch (error) {
      setSubmitError(error.message || 'Impossible de creer l inscription complete.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderParentsStep = () => (
    <div className='full-flow-parent-grid'>
      <FullFlowParentCard role='pere' selectedParent={pere} onSelect={setPere} />
      <FullFlowParentCard role='mere' selectedParent={mere} onSelect={setMere} />
    </div>
  )

  const renderStudentStep = () => (
    <div className='full-flow-step-stack'>
      <section className='full-flow-section'>
        <div>
          <h2>Informations de l eleve</h2>
          <p>Renseignez son identite telle qu elle apparait dans ses documents.</p>
        </div>

        <div className='full-flow-form-grid'>
          <Input
            id='full-flow-student-nom'
            label='Nom'
            value={student.nom}
            onChange={(event) => updateStudent('nom', event.target.value)}
            error={studentErrors.nom}
            required
          />
          <Input
            id='full-flow-student-postnom'
            label='Postnom'
            value={student.postnom}
            onChange={(event) => updateStudent('postnom', event.target.value)}
            error={studentErrors.postnom}
            required
          />
          <Input
            id='full-flow-student-prenom'
            label='Prenom'
            value={student.prenom}
            onChange={(event) => updateStudent('prenom', event.target.value)}
            error={studentErrors.prenom}
            required
          />
          <Input
            id='full-flow-student-date'
            type='date'
            label='Date de naissance'
            value={student.date_naissance}
            onChange={(event) => updateStudent('date_naissance', event.target.value)}
            error={studentErrors.date_naissance}
            required
          />
          <Input
            id='full-flow-student-lieu'
            label='Lieu de naissance'
            value={student.lieu_naissance}
            onChange={(event) => updateStudent('lieu_naissance', event.target.value)}
            error={studentErrors.lieu_naissance}
            required
          />
          <div className='inscription-select-field'>
            <label htmlFor='full-flow-student-genre'>Genre</label>
            <select
              id='full-flow-student-genre'
              value={student.genre}
              className={studentErrors.genre ? 'inscription-select inscription-select--error' : 'inscription-select'}
              onChange={(event) => updateStudent('genre', event.target.value)}
              required
            >
              <option value=''>Selectionner un genre</option>
              {FULL_FLOW_GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {studentErrors.genre && <span className='inscription-field-error'>{studentErrors.genre}</span>}
          </div>
        </div>
      </section>

      <section className='full-flow-section'>
        <div>
          <h2>Origine de l eleve</h2>
          <p>Ces informations sont facultatives et peuvent etre completees plus tard.</p>
        </div>

        <div className='full-flow-form-grid'>
          <Input
            id='full-flow-student-province'
            label='Province d origine'
            value={student.province_origine}
            onChange={(event) => updateStudent('province_origine', event.target.value)}
          />
          <Input
            id='full-flow-student-territoire'
            label='Territoire d origine'
            value={student.territoire_origine}
            onChange={(event) => updateStudent('territoire_origine', event.target.value)}
          />
          <Input
            id='full-flow-student-collectivite'
            label='Collectivite d origine'
            value={student.collectivite_origine}
            onChange={(event) => updateStudent('collectivite_origine', event.target.value)}
          />
          <Input
            id='full-flow-student-groupement'
            label='Groupement d origine'
            value={student.groupement_origine}
            onChange={(event) => updateStudent('groupement_origine', event.target.value)}
          />
          <Input
            id='full-flow-student-localite'
            label='Localite d origine'
            value={student.localite_origine}
            onChange={(event) => updateStudent('localite_origine', event.target.value)}
          />
        </div>
      </section>

      <section className='full-flow-section full-flow-address-panel'>
        <label className='full-flow-checkbox'>
          <input
            type='checkbox'
            checked={student.withAdresse}
            onChange={(event) => updateStudent('withAdresse', event.target.checked)}
          />
          Ajouter l adresse de l eleve
        </label>

        {student.withAdresse && (
          <FlowAdresseFields
            idPrefix='full-flow-student-adresse'
            form={student.adresse}
            errors={studentErrors.adresse}
            onChange={updateStudentAdresse}
          />
        )}
      </section>
    </div>
  )

  const renderSchoolStep = () => (
    <div className='full-flow-step-stack'>
      <article className='active-annee-card'>
        <div className='active-annee-card__icon'>
          <CalendarCheck2 size={26} aria-hidden='true' />
        </div>
        <div className='active-annee-card__content'>
          <p className='active-annee-card__label'>Annee scolaire active</p>
          {isLoadingOptions && <p className='active-annee-card__state'>Chargement...</p>}
          {!isLoadingOptions && activeError && <p className='active-annee-card__error'>{activeError}</p>}
          {!isLoadingOptions && !activeError && activeAnnee?.id && (
            <div className='active-annee-card__details'>
              <h2>{getDesignation(activeAnnee)}</h2>
              <StatusBadge value={activeAnnee.statut} />
            </div>
          )}
          {!isLoadingOptions && !activeError && !activeAnnee?.id && (
            <p className='active-annee-card__state'>Aucune annee scolaire active.</p>
          )}
        </div>
      </article>

      {isLoadingOptions && <div className='inscription-loading' role='status'>Chargement des choix...</div>}

      {!isLoadingOptions && optionsError && (
        <ModuleState
          type='error'
          title='Choix indisponibles'
          message={optionsError}
          actionLabel='Reessayer'
          onAction={loadOptions}
        />
      )}

      {!isLoadingOptions && !optionsError && (
        <section className='full-flow-section'>
          <div>
            <h2>Classe et annee scolaire</h2>
            <p>L annee active est preselectionnee. Vous pouvez en choisir une autre si necessaire.</p>
          </div>

          <div className='full-flow-school-grid'>
            <SearchableSelectField
              id='class_id'
              label='Classe'
              value={school.class_id}
              options={classeOptions}
              placeholder='Rechercher une classe'
              emptyMessage='Aucune classe ne correspond a votre recherche.'
              error={schoolErrors.class_id}
              onChange={updateSchool}
            />
            <SearchableSelectField
              id='annee_scolaire_id'
              label='Annee scolaire'
              value={school.annee_scolaire_id}
              options={anneeOptions}
              placeholder='Rechercher une annee scolaire'
              emptyMessage='Aucune annee scolaire ne correspond a votre recherche.'
              error={schoolErrors.annee_scolaire_id}
              onChange={updateSchool}
            />
          </div>
        </section>
      )}
    </div>
  )

  const renderSummaryStep = () => (
    <div className='full-flow-summary-stack'>
      <section className='detail-section-card'>
        <div className='detail-section-card__header'><h2>Eleve</h2></div>
        <dl className='inscription-detail-grid'>
          <DetailField label='Nom' value={student.nom} />
          <DetailField label='Postnom' value={student.postnom} />
          <DetailField label='Prenom' value={student.prenom} />
          <DetailField label='Date de naissance' value={formatDate(student.date_naissance)} />
          <DetailField label='Lieu de naissance' value={student.lieu_naissance} />
          <DetailField label='Genre' value={student.genre === 'M' ? 'Masculin' : 'Feminin'} />
          <DetailField
            label='Adresse'
            value={student.withAdresse ? formatAdresse(student.adresse) : 'Non renseignee'}
          />
        </dl>
      </section>

      <section className='detail-section-card'>
        <div className='detail-section-card__header'><h2>Parents</h2></div>
        <dl className='inscription-detail-grid'>
          <DetailField label='Pere' value={getParentName(pere)} />
          <DetailField label='Telephone du pere' value={pere?.phone} />
          <DetailField label='Adresse du pere' value={formatAdresse(pere?.adresse)} />
          <DetailField label='Mere' value={getParentName(mere)} />
          <DetailField label='Telephone de la mere' value={mere?.phone} />
          <DetailField label='Adresse de la mere' value={formatAdresse(mere?.adresse)} />
        </dl>
      </section>

      <section className='detail-section-card'>
        <div className='detail-section-card__header'><h2>Inscription</h2></div>
        <dl className='inscription-detail-grid'>
          <DetailField label='Classe' value={getDesignation(selectedClasse)} />
          <DetailField label='Annee scolaire' value={getDesignation(selectedAnnee)} />
        </dl>
      </section>
    </div>
  )

  return (
    <section className='inscription-page full-flow-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/inscriptions' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux inscriptions
          </Link>
          <p className='inscription-page-kicker'>Assistant d inscription</p>
          <h1>Inscription complete</h1>
          <p className='inscription-page-description'>
            Creez l eleve, rattachez ses parents puis choisissez sa classe depuis une seule interface.
          </p>
        </div>
      </header>

      <ol className='full-flow-steps' aria-label='Etapes de l inscription complete'>
        {FULL_FLOW_STEPS.map((step, index) => (
          <li
            key={step.id}
            className={`full-flow-step ${index === stepIndex ? 'full-flow-step--active' : ''} ${index < stepIndex ? 'full-flow-step--complete' : ''}`}
          >
            <span>{index < stepIndex ? <Check size={15} aria-hidden='true' /> : index + 1}</span>
            <strong>{step.label}</strong>
          </li>
        ))}
      </ol>

      <div className='inscription-form-panel full-flow-panel'>
        {stepError && <Feedback type='error' message={stepError} onClose={() => setStepError('')} />}
        {submitError && (
          <Feedback
            type='error'
            title='Echec de l inscription'
            message={submitError}
            onClose={() => setSubmitError('')}
          />
        )}

        {stepIndex === 0 && renderParentsStep()}
        {stepIndex === 1 && renderStudentStep()}
        {stepIndex === 2 && renderSchoolStep()}
        {stepIndex === 3 && renderSummaryStep()}

        <div className='inscription-form-actions'>
          {stepIndex > 0 && (
            <Button
              type='button'
              variant='ghost'
              label='Precedent'
              onClick={previousStep}
              disabled={isSubmitting}
              className='inscription-action inscription-action--secondary'
            />
          )}

          {stepIndex < FULL_FLOW_STEPS.length - 1 && (
            <Button
              type='button'
              variant='super'
              label='Continuer'
              onClick={nextStep}
              disabled={isSubmitting || (stepIndex === 2 && (isLoadingOptions || Boolean(optionsError)))}
              className='inscription-action inscription-action--primary'
            />
          )}

          {stepIndex === FULL_FLOW_STEPS.length - 1 && (
            <Button
              type='button'
              variant='super'
              label={isSubmitting ? 'Validation...' : 'Valider l inscription'}
              loading={isSubmitting}
              onClick={handleSubmit}
              className='inscription-action inscription-action--primary'
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default FullFlowInscriptionPage
