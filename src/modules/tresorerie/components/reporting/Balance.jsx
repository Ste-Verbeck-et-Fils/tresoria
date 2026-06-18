import React, { useEffect, useState } from 'react'
import { getBalance } from '../../../../services/comptabiliteService'
import Loader from '../../../../components/ui/Loader'
import Button from '../../../../components/ui/Button'
import { formatAmount } from '../../../inscriptions/utils/amounts'
import * as XLSX from 'xlsx'

const Balance = ({ filters }) => {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBalance()
  }, [filters])

  const loadBalance = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters?.start_date) params.dateDebut = filters.start_date
      if (filters?.end_date) params.dateFin = filters.end_date
      
      const payload = await getBalance(params)
      if (payload.success) setBalance(payload.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (!balance) return
    const headers = ['Compte', 'Intitulé', 'Total Débit', 'Total Crédit', 'Solde Débit', 'Solde Crédit']
    const rows = balance.lignes.map(l => ({
      Compte: l.compte,
      'Intitulé': l.intitule,
      'Total Débit': l.totalDebit,
      'Total Crédit': l.totalCredit,
      'Solde Débit': l.soldeDebit,
      'Solde Crédit': l.soldeCredit
    }))
    
    rows.push({
      Compte: 'TOTAUX',
      'Intitulé': '',
      'Total Débit': balance.totaux.totalDebit,
      'Total Crédit': balance.totaux.totalCredit,
      'Solde Débit': balance.totaux.totalSoldeDebit,
      'Solde Crédit': balance.totaux.totalSoldeCredit
    })

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Balance Générale')
    XLSX.writeFile(workbook, 'balance_generale.xlsx')
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <Loader message='Chargement de la balance...' />
  if (!balance) return <div>Erreur de chargement.</div>

  return (
    <div style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Balance Générale</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button label='Exporter Excel' variant='secondary' className='inscription-action' onClick={exportToExcel} />
          <Button label='Imprimer (PDF)' variant='secondary' className='inscription-action' onClick={handlePrint} />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }} className='balance-print-area'>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ padding: '12px' }}>Compte</th>
              <th style={{ padding: '12px' }}>Intitulé</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Total Débit</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Total Crédit</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Solde Débit</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Solde Crédit</th>
            </tr>
          </thead>
          <tbody>
            {balance.lignes.map((l) => (
              <tr key={l.compte} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{l.compte}</td>
                <td style={{ padding: '12px' }}>{l.intitule}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{formatAmount(l.totalDebit)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{formatAmount(l.totalCredit)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: 'green' }}>{l.soldeDebit > 0 ? formatAmount(l.soldeDebit) : '-'}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: 'red' }}>{l.soldeCredit > 0 ? formatAmount(l.soldeCredit) : '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
              <td colSpan={2} style={{ padding: '12px' }}>TOTAUX</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{formatAmount(balance.totaux.totalDebit)}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{formatAmount(balance.totaux.totalCredit)}</td>
              <td style={{ padding: '12px', textAlign: 'right', color: 'green' }}>{formatAmount(balance.totaux.totalSoldeDebit)}</td>
              <td style={{ padding: '12px', textAlign: 'right', color: 'red' }}>{formatAmount(balance.totaux.totalSoldeCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .balance-print-area, .balance-print-area * {
            visibility: visible;
          }
          .balance-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default Balance
