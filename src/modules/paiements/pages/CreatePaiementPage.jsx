import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import { getInscriptions, getInscriptionSolde } from '../../../services/inscriptionService'
import { createPaiement } from '../../../services/paiementService'
import DetailField from '../../inscriptions/components/DetailField'
import ModuleState from '../../inscriptions/components/ModuleState'
import SearchableSelectField from '../../inscriptions/components/SearchableSelectField'
import SelectField from '../../inscriptions/components/SelectField'
import {
  getDesignation,
  getInscriptionAnnee,
  getInscriptionClasse,
  getInscriptionStudent,
  getStudentName,
  normalizeCollection,
} from '../../inscriptions/utils/data'
import {
  formatAmount,
  getInscriptionFinancialSummary,
  unwrapInscriptionSolde,
} from '../../inscriptions/utils/amounts'
import {
  getInscriptionOptionLabel,
  getPaiementPayload,
  isAnneeScolaireCloturee,
  MODE_PAIEMENT_OPTIONS,
  MOTIF_PAIEMENT_OPTIONS,
  normalizePaiementForm,
  unwrapPaiement,
  validatePaiementForm,
} from '../utils/paiement'

const getInitialForm = (navigationState = {}) => normalizePaiementForm({
  inscription_id: navigationState?.inscriptionId || navigationState?.inscription_id || '',
})

const CreatePaiementPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const initialForm = getInitialForm(location.state)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [inscriptions, setInscriptions] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [solde, setSolde] = useState(null)
  const [isLoadingSolde, setIsLoadingSolde] = useState(Boolean(initialForm.inscription_id))
  const [soldeError, setSoldeError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedInscription = useMemo(
    () => inscriptions.find((inscription) => String(inscription.id) === String(form.inscription_id)),
    [form.inscription_id, inscriptions]
  )
  const selectedAnneeScolaire = selectedInscription ? getInscriptionAnnee(selectedInscription) : null
  const isSelectedInscriptionClosed = selectedInscription ? isAnneeScolaireCloturee(selectedInscription) : false
  const financialSummary = useMemo(
    () => getInscriptionFinancialSummary(selectedInscription || {}, solde),
    [selectedInscription, solde]
  )

  const applyInscriptionsPayload = useCallback((payload) => {
    setInscriptions(normalizeCollection(payload))
  }, [])

  const loadOptions = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError('')

    try {
      const payload = await getInscriptions()
      applyInscriptionsPayload(payload)
    } catch (error) {
      setOptionsError(error.message || 'Impossible de charger les inscriptions.')
    } finally {
      setIsLoadingOptions(false)
    }
  }, [applyInscriptionsPayload])

  useEffect(() => {
    let isCancelled = false

    getInscriptions()
      .then((payload) => {
        if (!isCancelled) {
          applyInscriptionsPayload(payload)
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setOptionsError(error.message || 'Impossible de charger les inscriptions.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingOptions(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [applyInscriptionsPayload])

  useEffect(() => {
    if (!form.inscription_id) {
      return undefined
    }

    let isCancelled = false

    getInscriptionSolde(form.inscription_id)
      .then((payload) => {
        if (!isCancelled) {
          setSolde(unwrapInscriptionSolde(payload))
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setSolde(null)
          setSoldeError(error.message || 'Impossible de charger le solde de cette inscription.')
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
  }, [form.inscription_id])

  const inscriptionOptions = useMemo(
    () => inscriptions.map((inscription) => {
      const isClosed = isAnneeScolaireCloturee(inscription)

      return {
        value: inscription.id,
        label: getInscriptionOptionLabel(inscription),
        searchText: [
          getStudentName(getInscriptionStudent(inscription)),
          getDesignation(getInscriptionClasse(inscription)),
          getDesignation(getInscriptionAnnee(inscription)),
        ].join(' '),
        disabled: isClosed,
        disabledReason: isClosed ? 'Paiement interdit : annee scolaire cloturee' : '',
      }
    }),
    [inscriptions]
  )

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [id]: value }))

    if (id === 'inscription_id') {
      setSolde(null)
      setSoldeError('')
      setIsLoadingSolde(Boolean(value))
    }

    if (errors[id]) {
      setErrors((currentErrors) => ({ ...currentErrors, [id]: '' }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')

    const nextErrors = validatePaiementForm(form, selectedInscription)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await createPaiement(getPaiementPayload(form))
      const paiement = unwrapPaiement(payload)

      navigate(paiement?.id ? `/paiements/${paiement.id}` : '/paiements', {
        replace: true,
        state: { successMessage: 'Paiement enregistre avec succes.' },
      })
    } catch (error) {
      setFeedback(error.message || 'Impossible d enregistrer le paiement.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormUnavailable = isLoadingOptions || Boolean(optionsError)
  const isFormDisabled = isFormUnavailable || isSubmitting

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/paiements' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux paiements
          </Link>
          <p className='inscription-page-kicker'>Module paiement</p>
          <h1>Nouveau paiement</h1>
          <p className='inscription-page-description'>
            Selectionnez une inscription ouverte, verifiez son solde, puis enregistrez le paiement.
          </p>
        </div>
      </header>

      {isLoadingOptions && <div className='inscription-loading'>Chargement du formulaire...</div>}

      {!isLoadingOptions && optionsError && (
        <ModuleState
          type='error'
          title='Formulaire indisponible'
          message={optionsError}
          actionLabel='Reessayer'
          onAction={loadOptions}
        />
      )}

      {!isFormUnavailable && (
        <form className='inscription-form-panel inscription-create-form' onSubmit={handleSubmit}>
          {feedback && (
            <Feedback
              type='error'
              title='Echec de l enregistrement'
              message={feedback}
              onClose={() => setFeedback('')}
            />
          )}

          <section className='student-form-section'>
            <h2>Inscription</h2>
            <div className='inscription-form-grid'>
              <SearchableSelectField
                id='inscription_id'
                label='Inscription'
                value={form.inscription_id}
                options={inscriptionOptions}
                placeholder='Rechercher par eleve, classe ou annee'
                emptyMessage='Aucune inscription ne correspond a votre recherche.'
                error={errors.inscription_id}
                disabled={isFormDisabled}
                onChange={handleChange}
              />
            </div>

            {isSelectedInscriptionClosed && (
              <Feedback
                type='warning'
                message='Paiement interdit : l annee scolaire de cette inscription est cloturee.'
              />
            )}
          </section>

          {selectedInscription && (
            <section className='inscription-amount-panel'>
              <div>
                <h2>Solde de l inscription</h2>
                <p>
                  Les anciennes dettes sont reglees sur la nouvelle inscription ou elles ont ete reportees.
                </p>
              </div>

              <dl className='inscription-detail-grid'>
                <DetailField
                  label='Eleve'
                  value={getStudentName(getInscriptionStudent(selectedInscription))}
                />
                <DetailField
                  label='Classe'
                  value={getDesignation(getInscriptionClasse(selectedInscription), `Classe #${selectedInscription.class_id || '-'}`)}
                />
                <DetailField
                  label='Annee scolaire'
                  value={getDesignation(selectedAnneeScolaire, `Annee #${selectedInscription.annee_scolaire_id || '-'}`)}
                />
              </dl>

              {isLoadingSolde && <div className='inscription-loading'>Chargement du solde...</div>}
              {!isLoadingSolde && soldeError && (
                <Feedback type='warning' message={soldeError} />
              )}

              <div className='inscription-amount-grid'>
                <article className='inscription-amount-card'>
                  <span>Frais de l annee scolaire</span>
                  <strong>{formatAmount(financialSummary.frais)}</strong>
                </article>
                <article className='inscription-amount-card'>
                  <span>Dette reportee</span>
                  <strong>{formatAmount(financialSummary.detteReportee)}</strong>
                  {financialSummary.detteReportee > 0 && <small>Dette ajoutee a cette inscription.</small>}
                </article>
                <article className='inscription-amount-card inscription-amount-card--total'>
                  <span>Total a payer</span>
                  <strong>{formatAmount(financialSummary.totalAPayer)}</strong>
                </article>
                <article className='inscription-amount-card'>
                  <span>Total paye</span>
                  <strong>{formatAmount(financialSummary.montantPaye)}</strong>
                </article>
                <article className='inscription-amount-card inscription-amount-card--total'>
                  <span>Reste a payer</span>
                  <strong>{formatAmount(financialSummary.resteAPayer)}</strong>
                </article>
              </div>
            </section>
          )}

          <section className='student-form-section'>
            <h2>Paiement</h2>
            <div className='inscription-form-grid'>
              <Input
                id='montant'
                type='number'
                min='1'
                label='Montant'
                placeholder='Montant'
                value={form.montant}
                error={errors.montant}
                disabled={isFormDisabled || isSelectedInscriptionClosed}
                onChange={handleChange}
              />
              <SelectField
                id='motif'
                label='Motif'
                value={form.motif}
                options={MOTIF_PAIEMENT_OPTIONS}
                placeholder='Selectionner un motif'
                error={errors.motif}
                disabled={isFormDisabled || isSelectedInscriptionClosed}
                onChange={handleChange}
              />
              <SelectField
                id='mode_paiement'
                label='Mode de paiement'
                value={form.mode_paiement}
                options={MODE_PAIEMENT_OPTIONS}
                placeholder='Selectionner un mode'
                error={errors.mode_paiement}
                disabled={isFormDisabled || isSelectedInscriptionClosed}
                onChange={handleChange}
              />
              <Input
                id='reference'
                type='text'
                label='Reference externe (optionnel)'
                placeholder='Reference externe (optionnel)'
                value={form.reference}
                disabled={isFormDisabled || isSelectedInscriptionClosed}
                onChange={handleChange}
              />
            </div>
          </section>

          <div className='inscription-form-actions'>
            <Button
              type='button'
              variant='ghost'
              label='Annuler'
              disabled={isSubmitting}
              onClick={() => navigate('/paiements')}
              className='inscription-action inscription-action--secondary'
            />
            <Button
              type='submit'
              variant='super'
              label={isSubmitting ? 'Enregistrement...' : 'Enregistrer le paiement'}
              icon={<CreditCard size={17} />}
              loading={isSubmitting}
              disabled={isFormDisabled || isSelectedInscriptionClosed}
              className='inscription-action inscription-action--primary'
            />
          </div>
        </form>
      )}
    </section>
  )
}

export default CreatePaiementPage
