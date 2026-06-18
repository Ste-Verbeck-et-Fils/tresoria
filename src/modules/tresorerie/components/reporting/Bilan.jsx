import React, { useEffect, useState } from 'react'
import { getBilan } from '../../../../services/comptabiliteService'
import Loader from '../../../../components/ui/Loader'
import Button from '../../../../components/ui/Button'
import { formatAmount } from '../../../inscriptions/utils/amounts'
import * as XLSX from 'xlsx'

const Bilan = () => {
  const [bilan, setBilan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBilan()
  }, [])

  const loadBilan = async () => {
    try {
      setLoading(true)
      const payload = await getBilan()
      if (payload.success) setBilan(payload.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (!bilan) return
    
    // Create rows for Excel combining Actif and Passif side by side
    const actifEntries = Object.entries(bilan.actif)
    const passifEntries = Object.entries(bilan.passif)
    const maxLen = Math.max(actifEntries.length, passifEntries.length)
    
    const rows = []
    
    for (let i = 0; i < maxLen; i++) {
      const a = actifEntries[i] || [null, { intitule: '', montant: '' }]
      const p = passifEntries[i] || [null, { intitule: '', montant: '' }]
      
      rows.push({
        'Compte Actif': a[0] || '',
        'Intitulé Actif': a[1].intitule,
        'Montant Actif': a[1].montant !== '' ? a[1].montant : '',
        '|': '|',
        'Compte Passif': p[0] || '',
        'Intitulé Passif': p[1].intitule,
        'Montant Passif': p[1].montant !== '' ? p[1].montant : ''
      })
    }
    
    // Totaux
    rows.push({
      'Compte Actif': 'TOTAL ACTIF',
      'Intitulé Actif': '',
      'Montant Actif': bilan.totalActif,
      '|': '|',
      'Compte Passif': 'TOTAL PASSIF',
      'Intitulé Passif': '',
      'Montant Passif': bilan.totalPassif
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bilan Comptable')
    XLSX.writeFile(workbook, 'bilan_comptable.xlsx')
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <Loader message='Chargement du bilan...' />
  if (!bilan) return <div>Erreur de chargement.</div>

  return (
    <div style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Bilan (Système OHADA Simplifié)</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button label='Exporter Excel' variant='secondary' className='inscription-action' onClick={exportToExcel} />
          <Button label='Imprimer (PDF)' variant='secondary' className='inscription-action' onClick={handlePrint} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }} className='bilan-print-area'>
        {/* ACTIF */}
        <div style={{ flex: 1, minWidth: '300px', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ background: 'var(--color-secondary)', color: 'white', padding: '12px', fontWeight: 'bold', textAlign: 'center' }}>
            ACTIF (Emplois)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {Object.entries(bilan.actif).map(([compte, details]) => (
                <tr key={compte} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px' }}>{compte} - {details.intitule}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{formatAmount(details.montant)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>TOTAL ACTIF</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-secondary)' }}>{formatAmount(bilan.totalActif)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* PASSIF */}
        <div style={{ flex: 1, minWidth: '300px', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ background: 'var(--color-secondary)', color: 'white', padding: '12px', fontWeight: 'bold', textAlign: 'center' }}>
            PASSIF (Ressources)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {Object.entries(bilan.passif).map(([compte, details]) => (
                <tr key={compte} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px' }}>{compte} - {details.intitule}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{formatAmount(details.montant)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>TOTAL PASSIF</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-secondary)' }}>{formatAmount(bilan.totalPassif)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <div style={{ marginTop: '24px', textAlign: 'center', padding: '16px', background: '#f1f5f9', borderRadius: '8px' }}>
        <strong>Équilibre du Bilan : </strong>
        <span style={{ color: Math.abs(bilan.totalActif - bilan.totalPassif) < 0.01 ? 'green' : 'red' }}>
          {Math.abs(bilan.totalActif - bilan.totalPassif) < 0.01 ? 'ÉQUILIBRÉ' : 'DÉSÉQUILIBRÉ'}
        </span>
      </div>
      
      {/* Styles for printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bilan-print-area, .bilan-print-area * {
            visibility: visible;
          }
          .bilan-print-area {
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

export default Bilan
