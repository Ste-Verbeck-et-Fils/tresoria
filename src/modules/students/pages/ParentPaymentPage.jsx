/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import Loader from '../../../components/ui/Loader'
import { getStudents } from '../../../services/studentService'
import { getStudentInscriptions, getInscriptionSolde } from '../../../services/inscriptionService'
import { createParentPaiement } from '../../../services/paiementService'
import DetailField from '../../inscriptions/components/DetailField'
import ModuleState from '../../inscriptions/components/ModuleState'
import SelectField from '../../inscriptions/components/SelectField'
import {
  getDesignation,
  getInscriptionAnnee,
  getInscriptionClasse,
  getStudentName,
  normalizeCollection,
} from '../../inscriptions/utils/data'
import {
  formatAmount,
  getInscriptionFinancialSummary,
  toAmount,
} from '../../inscriptions/utils/amounts'

const MODE_OPTIONS = [
  { value: 'MOBILE_MONEY', label: 'Airtel Money', icon: Smartphone },
]

const normalizeSoldePayload = (payload) => (
  payload?.data?.inscription ||
  payload?.inscription ||
  payload?.data ||
  payload ||
  null
)

const ParentPaymentPage = () => {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [inscriptions, setInscriptions] = useState([])
  const [selectedInscriptionId, setSelectedInscriptionId] = useState('')
  const [soldePayload, setSoldePayload] = useState(null)
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isLoadingInscriptions, setIsLoadingInscriptions] = useState(false)
  const [isLoadingSolde, setIsLoadingSolde] = useState(false)
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')
  const [montant, setMontant] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadStudents = useCallback(async () => {
    setIsLoadingStudents(true)
    setPageError('')

    try {
      const payload = await getStudents()
      const studentsList = normalizeCollection(payload)
      setStudents(studentsList)

      if (studentsList.length === 1) {
        setSelectedStudentId(String(studentsList[0].id))
      }
    } catch (error) {
      setPageError(error.message || 'Impossible de charger la liste de vos enfants.')
    } finally {
      setIsLoadingStudents(false)
    }
  }, [])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  useEffect(() => {
    let isCancelled = false

    setFormError('')
    setInscriptions([])
    setSelectedInscriptionId('')
    setSoldePayload(null)
    setMontant('')

    if (!selectedStudentId) {
      return undefined
    }

    setIsLoadingInscriptions(true)

    getStudentInscriptions(selectedStudentId)
      .then((payload) => {
        if (isCancelled) return

        const inscriptionsList = normalizeCollection(payload)
        const payableInscriptions = inscriptionsList.filter((inscription) => inscription.statut === 'ACTIF')
        const visibleInscriptions = payableInscriptions.length > 0 ? payableInscriptions : inscriptionsList

        setInscriptions(visibleInscriptions)

        const preferredInscription = visibleInscriptions[0]
        if (preferredInscription?.id) {
          setSelectedInscriptionId(String(preferredInscription.id))
        } else {
          setFormError("Cet eleve n'a aucune inscription a payer.")
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setFormError(error.message || 'Impossible de charger les inscriptions de cet eleve.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingInscriptions(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [selectedStudentId])

  useEffect(() => {
    let isCancelled = false

    setFormError('')
    setSoldePayload(null)
    setMontant('')

    if (!selectedInscriptionId) {
      return undefined
    }

    setIsLoadingSolde(true)

    getInscriptionSolde(selectedInscriptionId)
      .then((payload) => {
        if (!isCancelled) {
          setSoldePayload(normalizeSoldePayload(payload))
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setFormError(error.message || 'Impossible de charger le reste a payer.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingSolde(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [selectedInscriptionId])

  const selectedStudent = useMemo(
    () => students.find((student) => String(student.id) === String(selectedStudentId)),
    [selectedStudentId, students]
  )

  const selectedInscription = useMemo(
    () => inscriptions.find((inscription) => String(inscription.id) === String(selectedInscriptionId)),
    [inscriptions, selectedInscriptionId]
  )

  const displayedInscription = soldePayload?.id ? soldePayload : selectedInscription
  const financialSummary = useMemo(
    () => getInscriptionFinancialSummary(displayedInscription || {}, soldePayload),
    [displayedInscription, soldePayload]
  )
  const resteAPayer = Math.max(0, toAmount(financialSummary.resteAPayer) ?? 0)
  const amount = toAmount(montant)
  const nextResteAPayer = amount !== null && amount > 0 && amount <= resteAPayer
    ? Math.max(0, resteAPayer - amount)
    : null

  const studentOptions = useMemo(
    () => students.map((student) => ({
      value: student.id,
      label: getStudentName(student),
    })),
    [students]
  )

  const inscriptionOptions = useMemo(
    () => inscriptions.map((inscription) => {
      const classe = getInscriptionClasse(inscription)
      const annee = getInscriptionAnnee(inscription)

      return {
        value: inscription.id,
        label: [
          getDesignation(classe, `Classe #${inscription.class_id || '-'}`),
          getDesignation(annee, `Annee #${inscription.annee_scolaire_id || '-'}`),
        ].join(' - '),
      }
    }),
    [inscriptions]
  )

  const isPaymentUnavailable = !selectedInscriptionId || isLoadingInscriptions || isLoadingSolde || !soldePayload || resteAPayer <= 0
  const inscriptionPlaceholder = isLoadingInscriptions
    ? 'Chargement...'
    : 'Selectionner une inscription'
  const submitLabel = isSubmitting
    ? 'Entrée...'
    : 'Confirmer l\'entrée'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!selectedStudentId || !selectedInscriptionId) {
      setFormError('Selectionnez un eleve et une inscription.')
      return
    }

    if (amount === null || amount <= 0) {
      setFormError('Le montant doit etre superieur a zero.')
      return
    }

    if (amount - resteAPayer > 0.000001) {
      setFormError(`Le montant depasse le reste a payer (${formatAmount(resteAPayer)}).`)
      return
    }

    if (phoneNumber.trim().length < 8) {
      setFormError('Renseignez le numero Airtel Money.')
      return
    }

    setIsSubmitting(true)

    try {
      await createParentPaiement({
        inscription_id: Number(selectedInscriptionId),
        montant: amount,
        motif: 'FRAIS_SCOLAIRE',
        mode_paiement: 'MOBILE_MONEY',
        description: `Entrée parent - ${selectedModeLabel}`,
        reference: `AM-${Date.now()}`
      })

      navigate(`/students/${selectedStudentId}/paiements`, {
        replace: true,
        state: { successMessage: 'Entrée effectuée avec succes.' },
      })
    } catch (error) {
      setFormError(error.message || 'Erreur lors du traitement de l\'entrée.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingStudents) {
    return <Loader message='Chargement de vos informations...' />
  }

  if (pageError) {
    return (
      <ModuleState
        type='error'
        title='Entrée indisponible'
        message={pageError}
        actionLabel='Reessayer'
        onAction={loadStudents}
      />
    )
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <h1>Payer les frais scolaires</h1>
          {selectedStudent && <p>{getStudentName(selectedStudent)}</p>}
        </div>
      </header>

      {students.length === 0
        ? (
          <ModuleState
            type='info'
            title='Aucun eleve'
            message='Aucun eleve lie a votre compte parent.'
            actionLabel='Actualiser'
            onAction={loadStudents}
          />
          )
        : (
          <form className='inscription-form-panel inscription-create-form' onSubmit={handleSubmit}>
            {formError && (
              <Feedback
                type='warning'
                message={formError}
                onClose={() => setFormError('')}
              />
            )}

            <section className='student-form-section'>
              <h2>Eleve</h2>
              <div className='inscription-form-grid'>
                <SelectField
                  id='student_id'
                  label='Eleve'
                  value={selectedStudentId}
                  options={studentOptions}
                  placeholder='Selectionner un eleve'
                  disabled={isSubmitting}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                />
                <SelectField
                  id='inscription_id'
                  label='Inscription'
                  value={selectedInscriptionId}
                  options={inscriptionOptions}
                  placeholder={inscriptionPlaceholder}
                  disabled={!selectedStudentId || isLoadingInscriptions || isSubmitting}
                  onChange={(event) => setSelectedInscriptionId(event.target.value)}
                />
              </div>
            </section>

            {selectedInscriptionId && (
              <section className='inscription-amount-panel'>
                <div>
                  <h2>Reste a payer</h2>
                  <p>Solde calcule sur les frais scolaires confirmes.</p>
                </div>

                {isLoadingSolde
                  ? (
                    <Loader message='Chargement du solde...' />
                    )
                  : (
                    <>
                      <dl className='inscription-detail-grid'>
                        <DetailField
                          label='Classe'
                          value={getDesignation(getInscriptionClasse(displayedInscription), `Classe #${displayedInscription?.class_id || '-'}`)}
                        />
                        <DetailField
                          label='Annee scolaire'
                          value={getDesignation(getInscriptionAnnee(displayedInscription), `Annee #${displayedInscription?.annee_scolaire_id || '-'}`)}
                        />
                      </dl>

                      <div className='inscription-amount-grid'>
                        <article className='inscription-amount-card'>
                          <span>Total a payer</span>
                          <strong>{formatAmount(financialSummary.totalAPayer)}</strong>
                        </article>
                        <article className='inscription-amount-card'>
                          <span>Total paye</span>
                          <strong>{formatAmount(financialSummary.montantPaye)}</strong>
                        </article>
                        <article className='inscription-amount-card inscription-amount-card--total'>
                          <span>Reste a payer</span>
                          <strong>{formatAmount(resteAPayer)}</strong>
                        </article>
                      </div>
                    </>
                    )}
              </section>
            )}

            {!isPaymentUnavailable && (
              <section className='student-form-section'>
                <h2>Entrée</h2>
                <div className='inscription-form-grid'>
                  <Input
                    id='montant'
                    type='number'
                    min='1'
                    max={resteAPayer}
                    step='0.01'
                    label='Montant'
                    placeholder='Montant'
                    value={montant}
                    disabled={isSubmitting}
                    onChange={(event) => setMontant(event.target.value)}
                  />
                  <Input
                    id='airtel_phone'
                    type='tel'
                    label='Numero Airtel Money'
                    placeholder='Ex: 099...'
                    value={phoneNumber}
                    disabled={isSubmitting}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                  />
                  <div />
                </div>

                {nextResteAPayer !== null && (
                  <Feedback
                    type='info'
                    message={`Nouveau reste a payer : ${formatAmount(nextResteAPayer)}`}
                  />
                )}

                <div className='inscription-form-actions' style={{ marginTop: '24px' }}>
                  <Button
                    type='button'
                    variant='ghost'
                    label='Annuler'
                    disabled={isSubmitting}
                    onClick={() => navigate('/students')}
                    className='inscription-action inscription-action--secondary'
                  />
                  <Button
                    type='submit'
                    variant='super'
                    label={submitLabel}
                    icon={<Smartphone size={17} />}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className='inscription-action inscription-action--primary'
                  />
                </div>
              </section>
            )}

            {selectedInscriptionId && !isLoadingSolde && soldePayload && resteAPayer <= 0 && (
              <Feedback type='success' message='Cette inscription est deja entierement payee.' />
            )}
          </form>
          )}
    </section>
  )
}

export default ParentPaymentPage
