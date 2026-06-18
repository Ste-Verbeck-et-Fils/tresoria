import React, { useEffect, useState } from 'react'
import { getGrandLivre } from '../../../../services/comptabiliteService'
import Loader from '../../../../components/ui/Loader'
import Button from '../../../../components/ui/Button'
import { formatAmount } from '../../../inscriptions/utils/amounts'
import { formatDateForApi } from '../../../inscriptions/utils/data'
import * as XLSX from 'xlsx'

const GrandLivre = ({ filters }) => {
  const [grandLivre, setGrandLivre] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGrandLivre()
  }, [filters])

  const loadGrandLivre = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters?.start_date) params.dateDebut = filters.start_date
      if (filters?.end_date) params.dateFin = filters.end_date
      
      const payload = await getGrandLivre(params)
      if (payload.success) setGrandLivre(payload.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (!grandLivre) return
    const headers = ['Date', 'Journal', 'Référence', 'Compte', 'Libellé', 'Débit', 'Crédit', 'Solde']
    const rows = grandLivre.map(l => ({
      Date: new Date(l.date).toLocaleDateString(),
      Journal: l.journal,
      'Référence': l.reference || '',
      Compte: l.compte,
      'Libellé': l.libelle,
      'Débit': l.debit,
      'Crédit': l.credit,
      Solde: l.solde
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Grand Livre')
    XLSX.writeFile(workbook, 'grand_livre.xlsx')
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <Loader message='Chargement du grand livre...' />
  if (!grandLivre) return <div>Erreur de chargement.</div>

  return (
    <div style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Grand Livre Comptable</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button label='Exporter Excel' variant='secondary' className='inscription-action' onClick={exportToExcel} />
          <Button label='Imprimer (PDF)' variant='secondary' className='inscription-action' onClick={handlePrint} />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }} className='grand-livre-print-area'>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ padding: '10px' }}>Date</th>
              <th style={{ padding: '10px' }}>Jrn</th>
              <th style={{ padding: '10px' }}>Réf</th>
              <th style={{ padding: '10px' }}>Compte</th>
              <th style={{ padding: '10px' }}>Libellé</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Débit</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Crédit</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Solde Cumulé</th>
            </tr>
          </thead>
          <tbody>
            {grandLivre.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucune écriture trouvée sur cette période.
                </td>
              </tr>
            ) : grandLivre.map((l, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '10px' }}>{new Date(l.date).toLocaleDateString()}</td>
                <td style={{ padding: '10px' }}>{l.journal}</td>
                <td style={{ padding: '10px' }}>{l.reference || '-'}</td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{l.compte}</td>
                <td style={{ padding: '10px' }}>{l.libelle}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{l.debit > 0 ? formatAmount(l.debit) : '-'}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{l.credit > 0 ? formatAmount(l.credit) : '-'}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{formatAmount(l.solde)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .grand-livre-print-area, .grand-livre-print-area * {
            visibility: visible;
          }
          .grand-livre-print-area {
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

export default GrandLivre
