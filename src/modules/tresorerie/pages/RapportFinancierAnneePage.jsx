import Loader from '../../../components/ui/Loader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, FileText, Printer, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import { getAnneesScolaires } from '../../../services/anneeScolaireService'
import { getRapportFinancierAnneeScolaire } from '../../../services/tresorerieService'
import ModuleState from '../../inscriptions/components/ModuleState'
import SearchableSelectField from '../../inscriptions/components/SearchableSelectField'
import { formatAmount } from '../../inscriptions/utils/amounts'
import logoGsEmmanuel from '../../../assets/images/logo_gsemmanuel.png'
import {
  getDesignation,
  normalizeCollection,
} from '../../inscriptions/utils/data'
import {
  getRapportFinancierGroups,
  getRapportFinancierSummary,
  unwrapRapportFinancier,
} from '../utils/tresorerie'
import '../styles/RapportFinancierAnneePage.css'
import * as XLSX from 'xlsx'

const RapportFinancierAnneePage = () => {
  const [anneesScolaires, setAnneesScolaires] = useState([])
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
  const [rapport, setRapport] = useState(null)
  const [isLoadingAnnees, setIsLoadingAnnees] = useState(true)
  const [isLoadingRapport, setIsLoadingRapport] = useState(false)
  const [anneesError, setAnneesError] = useState('')
  const [rapportError, setRapportError] = useState('')
  const [filterError, setFilterError] = useState('')
  const [isForbidden, setIsForbidden] = useState(false)
  const [forbiddenMessage, setForbiddenMessage] = useState('')

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
    setIsForbidden(false)
    setForbiddenMessage('')

    try {
      const payload = await getRapportFinancierAnneeScolaire(selectedAnneeId)
      setRapport(payload)
    } catch (error) {
      if (error.status === 403 || error.response?.status === 403) {
        setIsForbidden(true)
        setForbiddenMessage(error.message || 'Accès refusé.')
        setRapport(null)
      } else {
        setRapportError(error.message || 'Impossible de charger le rapport financier.')
      }
    } finally {
      setIsLoadingRapport(false)
    }
  }, [anneeScolaireId])

  useEffect(() => {
    let isCancelled = false

    getAnneesScolaires()
      .then((payload) => {
        if (!isCancelled) {
          const normalized = normalizeCollection(payload)
          setAnneesScolaires(normalized)

          if (!anneeScolaireId) {
            const anneeActive = normalized.find(a => a.statut === 'ACTIF' || a.status === 'ACTIVE' || a.is_active || a.active)
            if (anneeActive) {
              setAnneeScolaireId(anneeActive.id)
              loadRapport(anneeActive.id)
            }
          }
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
  const getMotifLabel = (motif) => {
    switch (motif) {
      case 'FRAIS_SCOLAIRE': return 'Frais scolaire'
      case 'FRAIS_ETUDE': return "Frais d'étude"
      case 'FRAIS_ETAT': return "Frais de l'État"
      case 'FRAIS_TRANSPORT': return 'Frais de transport'
      case 'AUTRE': return 'Autres'
      default: return motif
    }
  }

  const getCategorieLabel = (categorie) => {
    switch (categorie) {
      case 'SALAIRE': return 'Salaire'
      case 'CHAUFFEUR': return 'Chauffeur'
      case 'ENTRETIEN': return 'Entretien'
      case 'CARBURANT': return 'Carburant'
      case 'LOYER': return 'Loyer'
      case 'FOURNITURE': return 'Fourniture'
      case 'MAINTENANCE': return 'Maintenance'
      case 'ACHAT_MATERIEL': return 'Achat de matériel'
      case 'CHARGE_ADMINISTRATIVE': return 'Charge administrative'
      case 'EAU': return 'Eau'
      case 'ELECTRICITE': return 'Électricité'
      case 'TRANSPORT': return 'Transport'
      case 'AUTRE': return 'Autre'
      default: return categorie
    }
  }

  const getModeLabel = (mode) => {
    switch (mode) {
      case 'CASH': return 'Espèces'
      case 'MOBILE_MONEY': return 'Mobile Money'
      default: return mode
    }
  }

  const unwrappedRapport = useMemo(() => unwrapRapportFinancier(rapport), [rapport])
  const summary = useMemo(() => getRapportFinancierSummary(unwrappedRapport), [unwrappedRapport])
  const groups = useMemo(() => getRapportFinancierGroups(unwrappedRapport), [unwrappedRapport])

  const translatedPaiementsParMotif = useMemo(() => {
    return (groups?.paiementsParMotif || []).map(item => ({
      ...item,
      label: getMotifLabel(item.label)
    }))
  }, [groups?.paiementsParMotif])

  const translatedDepensesParCategorie = useMemo(() => {
    return (groups?.depensesParCategorie || []).map(item => ({
      ...item,
      label: getCategorieLabel(item.label)
    }))
  }, [groups?.depensesParCategorie])

  const translatedPaiementsParMode = useMemo(() => {
    return (groups?.paiementsParMode || []).map(item => ({
      ...item,
      label: getModeLabel(item.label)
    }))
  }, [groups?.paiementsParMode])

  const translatedDepensesParMode = useMemo(() => {
    return (groups?.depensesParMode || []).map(item => ({
      ...item,
      label: getModeLabel(item.label)
    }))
  }, [groups?.depensesParMode])

  const handleAnneeChange = (event) => {
    setAnneeScolaireId(event.target.value)
    setRapport(null)
    setRapportError('')
    setFilterError('')
    setIsForbidden(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    const tableEls = document.querySelectorAll('.excel-table')
    if (tableEls.length === 0) return

    const wb = XLSX.utils.book_new()

    // Convert first table (Main table)
    const ws1 = XLSX.utils.table_to_sheet(tableEls[0])
    XLSX.utils.book_append_sheet(wb, ws1, 'Flux Financiers')

    // Convert second table (Payment modes)
    if (tableEls.length > 1) {
      const ws2 = XLSX.utils.table_to_sheet(tableEls[1])
      XLSX.utils.book_append_sheet(wb, ws2, 'Modes de Paiement')
    }

    const anneeName = selectedAnnee ? getDesignation(selectedAnnee) : 'Annee'
    XLSX.writeFile(wb, `Rapport_Financier_${anneeName}.xlsx`)
  }

  const totalEntrees = useMemo(() => {
    if (!summary) return 0
    return (Number(summary.paiementsComptabilisables) || 0) + (Number(summary.paiementsNonComptabilisables) || 0)
  }, [summary])

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header no-print'>
        <div>
          <Link to='/tresorerie' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour a la tresorerie
          </Link>
          <h1>Rapport financier annuel</h1>
        </div>
      </header>

      <section className='module-filter-panel tresorerie-filter-panel no-print'>
        <div>
          <h2>Selectionner une annee scolaire</h2>
        </div>

        <div className='module-filter-panel__fields rapport-financier-filter-fields'>
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

            <Button
              type='button'
              variant='secondary'
              label='Exporter (Excel)'
              icon={<Download size={16} />}
              onClick={handleExportExcel}
              className='inscription-action'
            />
            <Button
              type='button'
              variant='secondary'
              label='Imprimer le rapport'
              icon={<Printer size={16} />}
              onClick={handlePrint}
              className='inscription-action'
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

      {!isLoadingRapport && isForbidden && (
        <ModuleState
          type='error'
          title='Accès réservé'
          message={forbiddenMessage || 'Vous n avez pas les permissions nécessaires pour accéder à ce rapport.'}
        />
      )}

      {!isLoadingRapport && !isForbidden && rapportError && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={rapportError}
          actionLabel='Reessayer'
          onAction={() => loadRapport()}
        />
      )}

      {!isLoadingRapport && !isForbidden && !rapportError && !unwrappedRapport && (
        <ModuleState
          title='Aucun rapport affiche'
          message='Selectionnez une annee scolaire puis lancez la recherche.'
        />
      )}

      {!isLoadingRapport && !isForbidden && !rapportError && unwrappedRapport && (
        <div className='rapport-financier-stack rapport-financier-print-container'>
          {/* En-tête visible uniquement lors de l'impression */}
          <div className='reporting-print-header' style={{ display: 'none' }}>
            <img src={logoGsEmmanuel} alt='Logo GS Emmanuel' style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>GS EMMANUEL SAUVE</h1>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#475569' }}>
                Rapport Financier Annuel — {getDesignation(selectedAnnee, `Année scolaire #${anneeScolaireId}`)}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                Généré le {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Résumé financier (Hero Card) */}
          <section className='rapport-financier-hero-card'>
            <div className='rapport-financier-hero-info'>
              <h2>Résumé financier annuel</h2>
              <p className='rapport-financier-hero-subtitle'>
                Année scolaire : <strong>{getDesignation(selectedAnnee, `Année #${anneeScolaireId}`)}</strong>
              </p>
            </div>

            <div className='rapport-financier-solde-block'>
              <div className='rapport-financier-solde-card'>
                <span className='solde-label'>Solde final net</span>
                <strong className={`solde-valeur ${summary.soldeFinal >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatAmount(summary.soldeFinal)}
                </strong>
                <span className='solde-explanation'>
                  Recettes comptabilisables ({formatAmount(summary.paiementsComptabilisables)}) - Dépenses confirmées ({formatAmount(summary.depensesConfirmees)})
                </span>
              </div>
            </div>
          </section>

          {/* Tableau Excel Principal (Recettes vs Dépenses) */}
          <div className='excel-table-container'>
            <table className='excel-table'>
              <thead>
                <tr className='excel-main-header'>
                  <th colSpan={3} className='excel-header-entrees'>
                    RECETTES (ENTRÉES)
                  </th>
                  <th colSpan={3} className='excel-header-sorties border-left-separator'>
                    DÉPENSES (SORTIES)
                  </th>
                </tr>
                <tr className='excel-sub-header'>
                  <th>Libellé</th>
                  <th className='text-center'>Mouvements</th>
                  <th className='text-right'>Montant</th>
                  <th className='border-left-separator'>Libellé</th>
                  <th className='text-center'>Mouvements</th>
                  <th className='text-right'>Montant</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.max(translatedPaiementsParMotif.length, translatedDepensesParCategorie.length) }).map((_, index) => {
                  const paiement = translatedPaiementsParMotif[index] || null
                  const depense = translatedDepensesParCategorie[index] || null

                  return (
                    <tr key={index}>
                      {/* Recettes (Entrées) */}
                      {paiement
                        ? (
                          <>
                            <td className='text-left'>{paiement.label}</td>
                            <td className='text-center'>{paiement.count ?? '-'}</td>
                            <td className='text-right'>{formatAmount(paiement.montant)}</td>
                          </>
                          )
                        : (
                          <>
                            <td />
                            <td />
                            <td />
                          </>
                          )}

                      {/* Dépenses (Sorties) */}
                      {depense
                        ? (
                          <>
                            <td className='text-left border-left-separator'>{depense.label}</td>
                            <td className='text-center'>{depense.count ?? '-'}</td>
                            <td className='text-right'>{formatAmount(depense.montant)}</td>
                          </>
                          )
                        : (
                          <>
                            <td className='border-left-separator' />
                            <td />
                            <td />
                          </>
                          )}
                    </tr>
                  )
                })}

                {/* Lignes de Sous-totaux */}
                <tr className='excel-row-subtotal'>
                  <td className='text-left font-semibold text-muted'>Comptabilisables (Frais scolaires)</td>
                  <td className='text-center text-muted'>-</td>
                  <td className='text-right font-semibold text-muted'>{formatAmount(summary.paiementsComptabilisables)}</td>

                  <td className='text-left border-left-separator font-semibold text-muted'>Confirmées (Décaissées)</td>
                  <td className='text-center text-muted'>-</td>
                  <td className='text-right font-semibold text-muted'>{formatAmount(summary.depensesConfirmees)}</td>
                </tr>

                <tr className='excel-row-subtotal'>
                  <td className='text-left font-semibold text-muted'>Non comptabilisables (Autres motifs)</td>
                  <td className='text-center text-muted'>-</td>
                  <td className='text-right font-semibold text-muted'>{formatAmount(summary.paiementsNonComptabilisables)}</td>

                  <td className='text-left border-left-separator font-semibold text-muted'>Annulées (Rejetées)</td>
                  <td className='text-center text-muted'>-</td>
                  <td className='text-right font-semibold text-muted'>{formatAmount(summary.depensesAnnulees)}</td>
                </tr>

                {/* Lignes de Totaux Généraux */}
                <tr className='excel-row-total'>
                  <td className='text-left font-bold excel-total-label'>Total Général des Entrées</td>
                  <td className='text-center font-bold'>-</td>
                  <td className='text-right font-bold excel-total-value'>{formatAmount(totalEntrees)}</td>

                  <td className='text-left border-left-separator font-bold excel-total-label'>Total Général des Sorties</td>
                  <td className='text-center font-bold'>-</td>
                  <td className='text-right font-bold excel-total-value'>{formatAmount(summary.depensesConfirmees)}</td>
                </tr>

                {/* Ligne de Solde Net Final */}
                <tr className='excel-row-solde'>
                  <td colSpan={5} className='text-right font-bold excel-solde-label'>
                    SOLDE FINAL NET (Recettes comptabilisables - Dépenses confirmées) :
                  </td>
                  <td className={`text-right font-bold excel-double-underline ${summary.soldeFinal >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatAmount(summary.soldeFinal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tableau Excel de Synthèse par Mode de Paiement */}
          <div className='excel-table-container' style={{ marginTop: '24px' }}>
            <table className='excel-table'>
              <thead>
                <tr className='excel-main-header'>
                  <th colSpan={3} className='excel-header-entrees'>
                    ENTRÉES PAR MODE DE PAIEMENT
                  </th>
                  <th colSpan={3} className='excel-header-sorties border-left-separator'>
                    SORTIES PAR MODE DE PAIEMENT
                  </th>
                </tr>
                <tr className='excel-sub-header'>
                  <th>Mode</th>
                  <th className='text-center'>Mouvements</th>
                  <th className='text-right'>Montant</th>
                  <th className='border-left-separator'>Mode</th>
                  <th className='text-center'>Mouvements</th>
                  <th className='text-right'>Montant</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.max(translatedPaiementsParMode.length, translatedDepensesParMode.length) }).map((_, index) => {
                  const paiementMode = translatedPaiementsParMode[index] || null
                  const depenseMode = translatedDepensesParMode[index] || null

                  return (
                    <tr key={index}>
                      {/* Entrées */}
                      {paiementMode
                        ? (
                          <>
                            <td className='text-left'>{paiementMode.label}</td>
                            <td className='text-center'>{paiementMode.count ?? '-'}</td>
                            <td className='text-right'>{formatAmount(paiementMode.montant)}</td>
                          </>
                          )
                        : (
                          <>
                            <td />
                            <td />
                            <td />
                          </>
                          )}

                      {/* Sorties */}
                      {depenseMode
                        ? (
                          <>
                            <td className='text-left border-left-separator'>{depenseMode.label}</td>
                            <td className='text-center'>{depenseMode.count ?? '-'}</td>
                            <td className='text-right'>{formatAmount(depenseMode.montant)}</td>
                          </>
                          )
                        : (
                          <>
                            <td className='border-left-separator' />
                            <td />
                            <td />
                          </>
                          )}
                    </tr>
                  )
                })}

                {/* Totaux Modes de Paiement */}
                <tr className='excel-row-total'>
                  <td className='text-left font-bold excel-total-label'>Total par Mode</td>
                  <td className='text-center font-bold'>-</td>
                  <td className='text-right font-bold excel-total-value'>{formatAmount(totalEntrees)}</td>

                  <td className='text-left border-left-separator font-bold excel-total-label'>Total par Mode</td>
                  <td className='text-center font-bold'>-</td>
                  <td className='text-right font-bold excel-total-value'>{formatAmount(summary.depensesConfirmees)}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}

    </section>
  )
}

export default RapportFinancierAnneePage
