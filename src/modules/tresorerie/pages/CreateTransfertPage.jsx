import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { ArrowLeft, SendHorizontal } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import Loader from '../../../components/ui/Loader'
import ModuleState from '../../inscriptions/components/ModuleState'
import SelectField from '../../inscriptions/components/SelectField'
import { createTransfert } from '../../../services/transfertService'
import { getComptesTresorerie } from '../../../services/compteTresorerieService'
import { normalizeCollection } from '../../inscriptions/utils/data'

const CreateTransfertPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    compte_source_id: '',
    compte_destination_id: '',
    montant: '',
    description: ''
  })
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [comptes, setComptes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadOptions = useCallback(async () => {
    setIsLoading(true)
    setOptionsError('')
    try {
      const payload = await getComptesTresorerie()
      setComptes(normalizeCollection(payload))
    } catch (error) {
      setOptionsError(error.message || 'Impossible de charger les comptes de trésorerie.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false
    loadOptions()
    return () => {
      isCancelled = true
    }
  }, [loadOptions])

  const compteOptions = useMemo(() => {
    const options = []
    
    const banque = comptes.find(c => c.type === 'BANQUE' || c.nom === 'Banque' || c.nom === 'Banque Principale')
    if (banque) options.push({ value: banque.id, label: 'Banque' })

    const caisse = comptes.find(c => c.nom === 'CAISSE_GENERAL') || comptes.find(c => c.type === 'CAISSE' && c.nature === 'GENERAL' && c.nom !== 'Banque')
    if (caisse) options.push({ value: caisse.id, label: 'Caisse' })

    const mm = comptes.find(c => c.nom === 'MOBILE_MONEY_GENERAL') || comptes.find(c => c.type === 'MOBILE_MONEY' && c.nature === 'GENERAL')
    if (mm) options.push({ value: mm.id, label: 'Mobile Money' })

    return options
  }, [comptes])

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((current) => ({ ...current, [id]: value }))

    if (errors[id]) {
      setErrors((current) => ({ ...current, [id]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.compte_source_id) newErrors.compte_source_id = 'Le compte source est requis'
    if (!form.compte_destination_id) newErrors.compte_destination_id = 'Le compte destination est requis'
    if (form.compte_source_id && form.compte_destination_id && form.compte_source_id === form.compte_destination_id) {
      newErrors.compte_destination_id = 'Le compte destination doit être différent du compte source'
    }
    if (!form.montant || Number(form.montant) <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à zéro'
    }
    return newErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')

    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      await createTransfert(form)
      navigate('/tresorerie/transferts', {
        replace: true,
        state: { successMessage: 'Transfert interne enregistré avec succès.' },
      })
    } catch (error) {
      setFeedback(error.message || 'Impossible d\'enregistrer le transfert.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormUnavailable = isLoading || Boolean(optionsError)
  const isFormDisabled = isFormUnavailable || isSubmitting

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/tresorerie/transferts' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux transferts
          </Link>
          <h1>Nouveau mouvement interne</h1>
        </div>
      </header>

      {isLoading && <Loader message='Chargement du formulaire...' />}

      {!isLoading && optionsError && (
        <ModuleState
          type='error'
          title='Formulaire indisponible'
          message={optionsError}
          actionLabel='Réessayer'
          onAction={loadOptions}
        />
      )}

      {!isFormUnavailable && (
        <form className='inscription-form-panel inscription-create-form' onSubmit={handleSubmit}>
          {feedback && (
            <Feedback
              type='error'
              title='Echec du transfert'
              message={feedback}
              onClose={() => setFeedback('')}
            />
          )}

          <section className='student-form-section'>
            <h2>Informations du transfert</h2>
            <div className='inscription-form-grid'>
              <SelectField
                id='compte_source_id'
                label='Compte source (Débit)'
                value={form.compte_source_id}
                options={compteOptions}
                placeholder='Sélectionner le compte source'
                error={errors.compte_source_id}
                disabled={isFormDisabled}
                onChange={handleChange}
              />
              <SelectField
                id='compte_destination_id'
                label='Compte destination (Crédit)'
                value={form.compte_destination_id}
                options={compteOptions}
                placeholder='Sélectionner le compte destination'
                error={errors.compte_destination_id}
                disabled={isFormDisabled}
                onChange={handleChange}
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <Input
                  id='montant'
                  type='number'
                  min='1'
                  step='0.01'
                  label='Montant'
                  placeholder='Ex: 50.00'
                  value={form.montant}
                  error={errors.montant}
                  disabled={isFormDisabled}
                  onChange={handleChange}
                />
              </div>

              <Input
                id='description'
                variant='textarea'
                label='Description (Optionnelle)'
                placeholder='Ajoutez un commentaire sur ce mouvement...'
                value={form.description}
                disabled={isFormDisabled}
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
              onClick={() => navigate('/tresorerie/transferts')}
              className='inscription-action inscription-action--secondary'
            />
            <Button
              type='submit'
              variant='super'
              label={isSubmitting ? 'Validation...' : 'Valider le transfert'}
              icon={<SendHorizontal size={17} />}
              loading={isSubmitting}
              disabled={isFormDisabled}
              className='inscription-action inscription-action--primary'
            />
          </div>
        </form>
      )}
    </section>
  )
}

export default CreateTransfertPage
