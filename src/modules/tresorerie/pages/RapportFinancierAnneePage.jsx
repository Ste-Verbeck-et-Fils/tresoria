import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { getRapportFinancierAnneeScolaire } from '../../../services/tresorerieService'
import ModuleState from '../../inscriptions/components/ModuleState'
import SearchableSelectField from '../../inscriptions/components/SearchableSelectField'
import { formatAmount } from '../../inscriptions/utils/amounts'
import {
  getDesignation,
  normalizeCollection,
} from '../../inscriptions/utils/data'
import {

  getRapportFinancierGroups,
  getRapportFinancierSummary,
} from '../utils/tresorerie'

const GroupTable = ({ title, emptyMessage, items }) => (
  <article className='detail-section-card rapport-financier-group-card'>
    <header className='detail-section-card__header'>
      <h2>{title}</h2>
    </header>

    {items.length === 0
      ? <p className='rapport-financier-empty'>{emptyMessage}</p>
      : (
        <div className='inscription-table-wrapper'>
          <table className='inscription-table'>
            <thead>
              <tr>
                <th>Libelle</th>
                <th>Montant</th>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.label}>
                  <td>{item.label}</td>
                  <td>{formatAmount(item.montant)}</td>
                  <td>{item.count ?? 'Non renseigne'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
  </article>
)

const RapportFinancierAnneePage = () => {
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
  const [rapport, setRapport] = useState(null)
  const [isLoadingAnnees, setIsLoadingAnnees] = useState(true)
  const [isLoadingRapport, setIsLoadingRapport] = useState(false)
  const [anneesError, setAnneesError] = useState('')
  const [rapportError, setRapportError] = useState('')
  const [filterError, setFilterError] = useState('')

  const loadAnnees = useCallback(async () => {
    setIsLoadingAnnees(true)
    setAnneesError('')

    try {
      const payload = await getAnneesScolaires()
      setAnneesScolaires(normalizeCollection(payload))
    } catch (error) {
      setAnneesError(error.message || 'Impossible de charger les annees scolaires.')
    } finally {
      setIsLoadingAnnees(false)
    }
  }, [])

  const loadRapport = useCallback(async (selectedAnneeId = anneeScolaireId) => {
    if (!selectedAnneeId) {
      setFilterError('Selectionnez une annee scolaire.')
      return
    }

    setIsLoadingRapport(true)
    setRapportError('')
    setFilterError('')

    try {
      const payload = await getRapportFinancierAnneeScolaire(selectedAnneeId)
      setRapport(payload)
    } catch (error) {
      setRapportError(error.message || 'Impossible de charger le rapport financier.')
    } finally {
      setIsLoadingRapport(false)
    }
  }, [anneeScolaireId])

  useEffect(() => {
    let isCancelled = false

    getAnneesScolaires()
      .then((payload) => {
        if (!isCancelled) {
          setAnneesScolaires(normalizeCollection(payload))
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setAnneesError(error.message || 'Impossible de charger les annees scolaires.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingAnnees(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const anneeOptions = useMemo(
    () => anneesScolaires.map((annee) => ({
      value: annee.id,
      label: getDesignation(annee, `Annee #${annee.id}`),
      searchText: annee.statut || annee.status || '',
    })),
    [anneesScolaires]
  )
  const selectedAnnee = useMemo(
    () => anneesScolaires.find((annee) => String(annee.id) === String(anneeScolaireId)),
    [anneeScolaireId, anneesScolaires]
  )
  const summary = useMemo(() => getRapportFinancierSummary(rapport), [rapport])
  const groups = useMemo(() => getRapportFinancierGroups(rapport), [rapport])

  const handleAnneeChange = (event) => {
    setAnneeScolaireId(event.target.value)
    setRapport(null)
    setRapportError('')
    setFilterError('')
  }

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/tresorerie' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour a la tresorerie
          </Link>
          <p className='inscription-page-kicker'>Module tresorerie</p>
          <h1>Rapport financier annuel</h1>
          <p className='inscription-page-description'>
            Consultez les entrees, sorties, soldes et groupements financiers d une annee scolaire.
          </p>
        </div>
      </header>

      <section className='module-filter-panel tresorerie-filter-panel'>
        <div>
          <h2>Selectionner une annee scolaire</h2>
          <p>Le rapport financier est calcule pour l annee scolaire choisie.</p>
        </div>

        <div className='module-filter-panel__fields tresorerie-filter-panel__fields'>
          <SearchableSelectField
            id='annee_scolaire_id'
            label='Annee scolaire'
            value={anneeScolaireId}
            options={anneeOptions}
            placeholder='Rechercher une annee scolaire'
            emptyMessage='Aucune annee scolaire ne correspond a votre recherche.'
            error={filterError}
            disabled={isLoadingAnnees}
            onChange={handleAnneeChange}
          />
          <div className='tresorerie-filter-panel__actions'>
            <Button
              type='button'
              variant='super'
              label={isLoadingRapport ? 'Chargement...' : 'Afficher le rapport'}
              icon={<FileText size={17} />}
              loading={isLoadingRapport}
              disabled={isLoadingAnnees}
              onClick={() => loadRapport()}
              className='inscription-action inscription-action--primary'
            />
          </div>
        </div>

        {anneesError && (
          <div className='module-filter-panel__warning'>
            <Feedback type='warning' message={anneesError} />
            <Button
              type='button'
              variant='ghost'
              label='Reessayer'
              onClick={loadAnnees}
              className='inscription-action inscription-action--secondary'
            />
          </div>
        )}
      </section>

      {isLoadingRapport && <Loader message='Chargement du rapport financier...' />}

      {!isLoadingRapport && rapportError && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={rapportError}
          actionLabel='Reessayer'
          onAction={() => loadRapport()}
        />
      )}

      {!isLoadingRapport && !rapportError && !rapport && (
        <ModuleState
          title='Aucun rapport affiche'
          message='Selectionnez une annee scolaire puis lancez la recherche.'
        />
      )}

      {!isLoadingRapport && !rapportError && rapport && (
        <div className='detail-page-stack'>
          <section className='inscription-amount-panel'>
            <div>
              <h2>Resume financier</h2>
              <p>{getDesignation(selectedAnnee, `Annee scolaire #${anneeScolaireId}`)}</p>
            </div>

            <div className='inscription-amount-grid rapport-financier-amount-grid'>
              <article className='inscription-amount-card'>
                <span>Paiements comptabilisables</span>
                <strong>{formatAmount(summary.paiementsComptabilisables)}</strong>
              </article>
              <article className='inscription-amount-card'>
                <span>Paiements non comptabilisables</span>
                <strong>{formatAmount(summary.paiementsNonComptabilisables)}</strong>
              </article>
              <article className='inscription-amount-card'>
                <span>Depenses confirmees</span>
                <strong>{formatAmount(summary.depensesConfirmees)}</strong>
              </article>
              <article className='inscription-amount-card'>
                <span>Depenses annulees</span>
                <strong>{formatAmount(summary.depensesAnnulees)}</strong>
              </article>
              <article className='inscription-amount-card inscription-amount-card--total'>
                <span>Solde final</span>
                <strong>{formatAmount(summary.soldeFinal)}</strong>
              </article>
            </div>
          </section>

          <div className='rapport-financier-group-grid'>
            <GroupTable
              title='Paiements par motif'
              emptyMessage='Aucun paiement groupe par motif.'
              items={groups.paiementsParMotif}
            />
            <GroupTable
              title='Depenses par categorie'
              emptyMessage='Aucune depense groupee par categorie.'
              items={groups.depensesParCategorie}
            />
            <GroupTable
              title='Paiements par mode de paiement'
              emptyMessage='Aucun paiement groupe par mode.'
              items={groups.paiementsParMode}
            />
            <GroupTable
              title='Depenses par mode de paiement'
              emptyMessage='Aucune depense groupee par mode.'
              items={groups.depensesParMode}
            />
          </div>
        </div>
      )}
    </section>
  )
}

export default RapportFinancierAnneePage
