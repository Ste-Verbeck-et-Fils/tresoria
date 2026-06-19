import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { createDepense } from '../../../services/depenseService'
import ModuleState from '../../inscriptions/components/ModuleState'
import SearchableSelectField from '../../inscriptions/components/SearchableSelectField'
import SelectField from '../../inscriptions/components/SelectField'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import {
  formatAmount,
} from '../../inscriptions/utils/amounts'
import {
  getDesignation,
  normalizeCollection,
} from '../../inscriptions/utils/data'
import {
  DEFAULT_DEPENSE_FORM,
  CATEGORIE_DEPENSE_OPTIONS,
  MODE_DEPENSE_OPTIONS,
  getAnneeScolaireOptionLabel,
  getDepensePayload,
  isAnneeScolaireCloturee,
  unwrapDepense,
  validateDepenseForm,
  getTransactionDateConstraints,
} from '../utils/depense'

const { minDate: minDateTransaction, maxDate: maxDateTransaction } = getTransactionDateConstraints()

const CreateDepensePage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(DEFAULT_DEPENSE_FORM)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedAnneeScolaire = useMemo(
    () => anneesScolaires.find((annee) => String(annee.id) === String(form.annee_scolaire_id)),
    [anneesScolaires, form.annee_scolaire_id]
  )
  const isSelectedAnneeClosed = selectedAnneeScolaire ? isAnneeScolaireCloturee(selectedAnneeScolaire) : false

  const applyAnneesPayload = useCallback((payload) => {
    setAnneesScolaires(normalizeCollection(payload))
  }, [])

  const loadOptions = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError('')

    try {
      const payload = await getAnneesScolaires()
      applyAnneesPayload(payload)
    } catch (error) {
      setOptionsError(error.message || 'Impossible de charger les annees scolaires.')
    } finally {
      setIsLoadingOptions(false)
    }
  }, [applyAnneesPayload])

  useEffect(() => {
    let isCancelled = false

    getAnneesScolaires()
      .then((payload) => {
        if (!isCancelled) {
          applyAnneesPayload(payload)
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setOptionsError(error.message || 'Impossible de charger les annees scolaires.')
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
  }, [applyAnneesPayload])

  const anneeOptions = useMemo(
    () => anneesScolaires.map((annee) => {
      const isClosed = isAnneeScolaireCloturee(annee)

      return {
        value: annee.id,
        label: getAnneeScolaireOptionLabel(annee),
        searchText: annee.statut || annee.status || '',
        disabled: isClosed,
        disabledReason: isClosed ? 'Sortie interdite : annee scolaire cloturee' : '',
      }
    }),
    [anneesScolaires]
  )

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [id]: value }))

    if (errors[id]) {
      setErrors((currentErrors) => ({ ...currentErrors, [id]: '' }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')

    const nextErrors = validateDepenseForm(form, selectedAnneeScolaire)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await createDepense(getDepensePayload(form))
      const depense = unwrapDepense(payload)

      navigate(depense?.id ? `/depenses/${depense.id}` : '/depenses', {
        replace: true,
        state: { successMessage: 'Sortie enregistrée avec succes.' },
      })
    } catch (error) {
      setFeedback(error.message || 'Impossible d enregistrer la sortie.')
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
          <Link to='/depenses' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux sorties
          </Link>
          <h1>Nouvelle sortie</h1>

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
            <h2>Annee scolaire</h2>
            <div className='inscription-form-grid'>
              <SearchableSelectField
                id='annee_scolaire_id'
                label='Annee scolaire'
                value={form.annee_scolaire_id}
                options={anneeOptions}
                placeholder='Rechercher une annee scolaire'
                emptyMessage='Aucune annee scolaire ne correspond a votre recherche.'
                error={errors.annee_scolaire_id}
                disabled={isFormDisabled}
                onChange={handleChange}
              />
            </div>

            {selectedAnneeScolaire && (
              <div className='inscription-detail-grid depense-annee-preview'>
                <div className='inscription-detail-field'>
                  <dt>Annee selectionnee</dt>
                  <dd>{getDesignation(selectedAnneeScolaire, `Annee #${selectedAnneeScolaire.id}`)}</dd>
                </div>
                <div className='inscription-detail-field'>
                  <dt>Statut</dt>
                  <dd><StatusBadge value={selectedAnneeScolaire.statut || selectedAnneeScolaire.status} /></dd>
                </div>
              </div>
            )}

            {isSelectedAnneeClosed && (
              <Feedback
                type='warning'
                message='Sortie interdite : l annee scolaire selectionnee est cloturee.'
              />
            )}
          </section>

          <section className='student-form-section'>
            <h2>Informations de la sortie</h2>
            <div className='inscription-form-grid'>
              {/* LIGNE 1 : 3 colonnes */}
              <SelectField
                id='categorie'
                label='Categorie'
                value={form.categorie}
                options={CATEGORIE_DEPENSE_OPTIONS}
                placeholder='Selectionner une categorie'
                error={errors.categorie}
                disabled={isFormDisabled || isSelectedAnneeClosed}
                onChange={handleChange}
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <Input
                  id='montant'
                  type='number'
                  min='1'
                  label='Montant'
                  placeholder='Saisissez le montant'
                  value={form.montant}
                  error={errors.montant}
                  disabled={isFormDisabled || isSelectedAnneeClosed}
                  onChange={handleChange}
                />
              </div>
              <SelectField
                id='mode_paiement'
                label='Mode de paiement'
                value={form.mode_paiement}
                options={MODE_DEPENSE_OPTIONS}
                placeholder='Selectionner un mode'
                error={errors.mode_paiement}
                disabled={isFormDisabled || isSelectedAnneeClosed}
                onChange={handleChange}
              />

              {/* LIGNE 2 : 3 colonnes */}
              <Input
                id='date_depense'
                type='date'
                label='Date de la sortie'
                min={minDateTransaction}
                max={maxDateTransaction}
                value={form.date_depense}
                error={errors.date_depense}
                disabled={isFormDisabled || isSelectedAnneeClosed}
                onChange={handleChange}
              />
              <Input
                id='beneficiaire'
                type='text'
                label='Bénéficiaire / Fournisseur (Optionnel)'
                placeholder='Ex: Chauffeur Jean, Garage Kivu Auto'
                value={form.beneficiaire}
                disabled={isFormDisabled || isSelectedAnneeClosed}
                onChange={handleChange}
              />

              {/* LIGNE 3 : Pleine largeur */}
              <Input
                id='libelle'
                type='text'
                label='Libellé (Titre de la sortie)'
                placeholder='Ex: Entretien du bus scolaire'
                value={form.libelle}
                error={errors.libelle}
                disabled={isFormDisabled || isSelectedAnneeClosed}
                onChange={handleChange}
                className='inscription-form-field--wide'
              />

              {/* Description : Pleine largeur */}
              <Input
                id='description'
                variant='textarea'
                label='Description et notes (Optionnel)'
                placeholder='Ajoutez des details ou observations supplementaires ici...'
                value={form.description}
                disabled={isFormDisabled || isSelectedAnneeClosed}
                onChange={handleChange}
                className='inscription-form-field--wide'
              />
            </div>
          </section>

          <div className='inscription-form-actions'>
            <Button
              type='button'
              variant='ghost'
              label='Annuler'
              disabled={isSubmitting}
              onClick={() => navigate('/depenses')}
              className='inscription-action inscription-action--secondary'
            />
            <Button
              type='submit'
              variant='super'
              label={isSubmitting ? 'Enregistrement...' : 'Enregistrer la sortie'}
              icon={<FileText size={17} />}
              loading={isSubmitting}
              disabled={isFormDisabled || isSelectedAnneeClosed}
              className='inscription-action inscription-action--primary'
            />
          </div>
        </form>
      )}
    </section>
  )
}

export default CreateDepensePage
