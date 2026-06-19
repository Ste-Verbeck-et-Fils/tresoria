import React, { useEffect, useState } from 'react'
import { getBalance } from '../../../../services/comptabiliteService'
import Loader from '../../../../components/ui/Loader'
import Button from '../../../../components/ui/Button'
import { formatAmount } from '../../../inscriptions/utils/amounts'
import logoGsEmmanuel from '../../../../assets/images/logo_gsemmanuel.png'
import SearchableSelectField from '../../../inscriptions/components/SearchableSelectField'
import * as XLSX from 'xlsx'

const Balance = ({ filters, compteOptions, onCompteChange }) => {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBalance()
  }, [filters])

  const loadBalance = async () => {
    try {
      setLoading(true)
      setError('')
      const params = {}
      if (filters?.start_date) params.dateDebut = filters.start_date
      if (filters?.end_date) params.dateFin = filters.end_date
      if (filters?.exercice_id) params.exerciceId = filters.exercice_id
      if (filters?.compte_id) params.compteId = filters.compte_id

      const payload = await getBalance(params)
      if (payload.success) setBalance(payload.data)
      else setError('Impossible de charger la balance.')
    } catch (e) {
      console.error(e)
      setError('Erreur lors du chargement de la balance.')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (!balance) return
    const rows = balance.lignes.map(l => ({
      Classe: l.classe,
      Compte: l.compte,
      Intitulé: l.intitule,
      'Total Débit': l.totalDebit,
      'Total Crédit': l.totalCredit,
      'Solde Débit': l.soldeDebit || '',
      'Solde Crédit': l.soldeCredit || ''
    }))

    rows.push({
      Classe: '',
      Compte: 'TOTAUX',
      Intitulé: '',
      'Total Débit': balance.totaux.totalDebit,
      'Total Crédit': balance.totaux.totalCredit,
      'Solde Débit': balance.totaux.totalSoldeDebit,
      'Solde Crédit': balance.totaux.totalSoldeCredit
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Balance Générale')
    XLSX.writeFile(workbook, 'balance_generale.xlsx')
  }

  const handlePrint = () => window.print()

  // Grouper par classe pour l'affichage
  const groupedByClasse = React.useMemo(() => {
    if (!balance) return {}
    const groups = {}
    balance.lignes.forEach(l => {
      const cl = l.classe || l.compte.charAt(0)
      if (!groups[cl]) groups[cl] = []
      groups[cl].push(l)
    })
    return groups
  }, [balance])

  const classeLabels = {
    '1': 'Classe 1 Capitaux propres et ressources assimilées',
    '2': 'Classe 2 Immobilisations',
    '3': 'Classe 3 Stocks',
    '4': 'Classe 4 Tiers',
    '5': 'Classe 5 Trésorerie',
    '6': 'Classe 6 Charges',
    '7': 'Classe 7 Produits'
  }

  return (
    <div
      style={{
        padding: '24px',
        background: 'var(--color-surface)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        marginTop: '24px'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Balance Générale</h2>
          {balance && (
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              {balance.lignes.length} compte{balance.lignes.length !== 1 ? 's' : ''} mouvementés
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: '250px' }}>
            <SearchableSelectField
              id='compte_id'
              placeholder='Rechercher un compte...'
              options={compteOptions}
              value={filters?.compte_id || ''}
              onChange={(e) => onCompteChange(e.target.value)}
            />
          </div>
          <Button label='Exporter Excel' variant='secondary' className='inscription-action' onClick={exportToExcel} />
          <Button label='Imprimer (PDF)' variant='secondary' className='inscription-action' onClick={handlePrint} />
        </div>
      </div>

      {loading ? (
        <Loader message='Chargement de la balance...' />
      ) : error ? (
        <div style={{ textAlign: 'center', color: 'var(--color-danger)', padding: '24px' }}>{error}</div>
      ) : !balance ? null : (
        <>


          {/* Table par classe */}
          <div className='balance-print-area' style={{ overflowX: 'auto' }}>
            {/* En-tête visible uniquement lors de l'impression */}
            <div className="reporting-print-header" style={{ display: 'none' }}>
              <img src={logoGsEmmanuel} alt="Logo GS Emmanuel" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>GS EMMANUEL</h1>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#475569' }}>
                  Rapport Comptable - Balance Générale (Généré le {new Date().toLocaleDateString('fr-FR')})
                </p>
              </div>
            </div>
            {Object.keys(groupedByClasse).sort().map(classe => {
              const lignes = groupedByClasse[classe]
              const classeDebit = lignes.reduce((s, l) => s + l.totalDebit, 0)
              const classeCredit = lignes.reduce((s, l) => s + l.totalCredit, 0)
              const classeSoldeD = lignes.reduce((s, l) => s + (l.soldeDebit || 0), 0)
              const classeSoldeC = lignes.reduce((s, l) => s + (l.soldeCredit || 0), 0)

              return (
                <div key={classe} style={{ marginBottom: '24px' }}>
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'var( #d4ddeaff)',
                      color: 'var(--color-secondary, #173f5f)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      borderRadius: '6px 6px 0 0',
                      borderBottom: '2px solid var(--color-secondary, #173f5f)'
                    }}
                  >
                    {classeLabels[classe] || `Classe ${classe}`}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Compte</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Intitulé</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Débit</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Crédit</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Solde Débit</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Solde Crédit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignes.map(l => (
                        <tr key={l.compte} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700 }}>{l.compte}</td>
                          <td style={{ padding: '8px' }}>{l.intitule}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatAmount(l.totalDebit)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatAmount(l.totalCredit)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-success, #16a34a)', fontWeight: l.soldeDebit > 0 ? 600 : 400 }}>
                            {l.soldeDebit > 0 ? formatAmount(l.soldeDebit) : '—'}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-danger, #dc2626)', fontWeight: l.soldeCredit > 0 ? 600 : 400 }}>
                            {l.soldeCredit > 0 ? formatAmount(l.soldeCredit) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f1f5f9', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                        <td colSpan={2} style={{ padding: '8px 12px' }}>Sous-total classe {classe}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatAmount(classeDebit)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatAmount(classeCredit)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-success, #16a34a)' }}>{formatAmount(classeSoldeD)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-danger, #dc2626)' }}>{formatAmount(classeSoldeC)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
            })}

            {/* Totaux généraux */}
            <div style={{ border: '2px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', marginTop: '8px' }}>
              <div style={{ padding: '8px 12px', background: '#1e293b', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                TOTAUX GÉNÉRAUX
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <tbody>
                  <tr style={{ background: '#f8fafc' }}>
                    <td colSpan={2} style={{ padding: '12px', fontWeight: 700 }}>TOTAL GÉNÉRAL</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>{formatAmount(balance.totaux.totalDebit)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>{formatAmount(balance.totaux.totalCredit)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--color-success, #16a34a)' }}>{formatAmount(balance.totaux.totalSoldeDebit)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--color-danger, #dc2626)' }}>{formatAmount(balance.totaux.totalSoldeCredit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <style>{`
            @media print {
              body * { visibility: hidden; }
              .balance-print-area, .balance-print-area * { visibility: visible; }
              .balance-print-area { position: absolute; left: 0; top: 0; width: 100%; }
              .reporting-print-header {
                display: flex !important;
                align-items: center;
                gap: 16px;
                border-bottom: 2px solid #000;
                padding-bottom: 12px;
                margin-bottom: 20px;
              }
            }
          `}</style>
        </>
      )}
    </div>
  )
}

export default Balance
