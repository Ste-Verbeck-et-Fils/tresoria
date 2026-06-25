import Loader from '../../../components/ui/Loader'
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
  MOIS_OPTIONS,
  ANNEE_OPTIONS,
  normalizePaiementForm,
  unwrapPaiement,
  validatePaiementForm,
  calculateDateFin,
  getTransactionDateConstraints,
} from '../utils/paiement'

const { minDate: minDateTransaction, maxDate: maxDateTransaction } = getTransactionDateConstraints()

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

    if (errors[id] || id === 'mode_paiement') {
      setErrors((currentErrors) => ({ ...currentErrors, [id]: '' }))
    }

    if (id === 'inscription_id') {
      setSolde(null)
      setSoldeError('')
      setIsLoadingSolde(Boolean(value))
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

    if (form.motif === 'FRAIS_SCOLAIRE') {
      const montantSaisi = Number(form.montant)
      const reste = financialSummary.resteAPayer
      if (reste !== null && montantSaisi - reste > 0.000001) {
        setFeedback(`Le montant depasse le reste à payer pour les frais scolaires (${formatAmount(reste)}).`)
        return
      }
    }

    setIsSubmitting(true)

    // Open window synchronously before await to avoid popup blocker
    const paymentWindow = window.open('about:blank', '_blank')

    try {
      const payload = getPaiementPayload(form)
      const response = await createPaiement(payload)

      if (response?.data?.checkoutParams) {
        const params = response.data.checkoutParams;
        if (paymentWindow) {
          const checkoutForm = paymentWindow.document.createElement('form');
          checkoutForm.method = 'POST';
          checkoutForm.action = params.actionUrl;
          
          Object.keys(params).forEach(key => {
            if (key !== 'actionUrl') {
              const input = paymentWindow.document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = params[key];
              checkoutForm.appendChild(input);
            }
          });
          
          paymentWindow.document.body.appendChild(checkoutForm);
          checkoutForm.submit();
        }
      } else if (paymentWindow) {
        paymentWindow.close();
      }

      const paiement = unwrapPaiement(response)
      navigate(paiement?.id ? `/paiements/${paiement.id}` : '/paiements', {
        replace: true,
        state: { successMessage: 'Entrée enregistrée avec succès.' },
      })
    } catch (error) {
      if (paymentWindow) paymentWindow.close();
      setFeedback(error.message || "Impossible d'enregistrer l'entrée.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormUnavailable = isLoadingOptions || Boolean(optionsError)
  const isFormDisabled = isFormUnavailable || isSubmitting

  const computedTransportDateFin = form.motif === 'FRAIS_TRANSPORT' ? calculateDateFin(form.transport_date_debut, form.transport_nombre_mois) : ''
  const computedMontantAttendu = form.motif === 'FRAIS_TRANSPORT' ? ((Number(form.transport_nombre_mois) || 0) * (Number(form.tarif_mensuel_transport) || 0)) : ''

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/paiements' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux entrées
          </Link>
          <h1>Nouvelle entrée</h1>

        </div>
      </header>

      {isLoadingOptions && <Loader message='Chargement du formulaire...' />}

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

          {selectedInscription && form.motif === 'FRAIS_SCOLAIRE' && (
            <section className='inscription-amount-panel'>
              <div>
                <h2>Solde des frais scolaires</h2>
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

              {isLoadingSolde && <Loader message='Chargement du solde...' />}
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
            <h2>Entrée</h2>
            <div className='inscription-form-grid'>
              {/* LIGNE 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <Input
                  id='montant'
                  type='number'
                  min='1'
                  label='Montant payé'
                  placeholder='Montant payé'
                  value={form.montant}
                  error={errors.montant}
                  disabled={isFormDisabled || isSelectedInscriptionClosed}
                  onChange={handleChange}
                />
              </div>
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

              {/* LIGNE 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <Input
                  id='date_paiement'
                  type='date'
                  label="Date de l'entrée"
                  min={minDateTransaction}
                  max={maxDateTransaction}
                  value={form.date_paiement}
                  error={errors.date_paiement}
                  disabled={isFormDisabled || isSelectedInscriptionClosed}
                  onChange={handleChange}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }} />
              {/* Empty div to preserve 3-column alignment */}
              <div />

              {/* LIGNE 3 : FRAIS_TRANSPORT uniquement */}
              {form.motif === 'FRAIS_TRANSPORT' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    <Input
                      id='transport_date_debut'
                      type='date'
                      label='Date début de couverture'
                      value={form.transport_date_debut}
                      error={errors.transport_date_debut}
                      disabled={isFormDisabled || isSelectedInscriptionClosed}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    <Input
                      id='transport_nombre_mois'
                      type='number'
                      min='1'
                      label='Nombre de mois payés'
                      placeholder='Ex: 1'
                      value={form.transport_nombre_mois}
                      error={errors.transport_nombre_mois}
                      disabled={isFormDisabled || isSelectedInscriptionClosed}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    <Input
                      id='tarif_mensuel_transport'
                      type='number'
                      min='1'
                      label='Tarif mensuel transport'
                      placeholder='Tarif mensuel'
                      value={form.tarif_mensuel_transport}
                      error={errors.tarif_mensuel_transport}
                      disabled={isFormDisabled || isSelectedInscriptionClosed}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}

              {/* LIGNE 4 : Date de fin et Montant attendu pour FRAIS_TRANSPORT */}
              {form.motif === 'FRAIS_TRANSPORT' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    <Input
                      id='transport_date_fin_readonly'
                      type='date'
                      label='Date fin de couverture (calculée)'
                      value={computedTransportDateFin}
                      disabled
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    <Input
                      id='montant_attendu_readonly'
                      type='text'
                      label='Montant attendu (calculé)'
                      value={computedMontantAttendu ? formatAmount(computedMontantAttendu) : ''}
                      disabled
                    />
                  </div>
                  {/* Empty div for 3rd column alignment if description takes a new row */}
                  <div />
                </>
              )}

              {/* LIGNE 5 */}
              <div className='inscription-form-field--wide'>
                <Input
                  id='description'
                  variant='textarea'
                  label='Description et notes (Optionnel)'
                  placeholder='Ajoutez des détails supplémentaires...'
                  value={form.description}
                  disabled={isFormDisabled || isSelectedInscriptionClosed}
                  onChange={handleChange}
                />
              </div>
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
              label={"Enregistrer l'entrée"}
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
