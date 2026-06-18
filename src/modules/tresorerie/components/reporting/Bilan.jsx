import React, { useEffect, useState } from 'react'
import { getBilan } from '../../../../services/comptabiliteService'
import Loader from '../../../../components/ui/Loader'
import Button from '../../../../components/ui/Button'
import { formatAmount } from '../../../inscriptions/utils/amounts'
import * as XLSX from 'xlsx'

const Bilan = ({ filters }) => {
  const [bilan, setBilan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBilan()
  }, [filters])

  const loadBilan = async () => {
    try {
      setLoading(true)
      setError('')
      const params = {}
      if (filters?.start_date) params.dateDebut = filters.start_date
      if (filters?.end_date) params.dateFin = filters.end_date
      if (filters?.exercice_id) params.exerciceId = filters.exercice_id

      const payload = await getBilan(params)
      if (payload.success) setBilan(payload.data)
      else setError('Impossible de charger le bilan.')
    } catch (e) {
      console.error(e)
      setError('Erreur lors du chargement du bilan.')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (!bilan) return

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

  const handlePrint = () => window.print()

  if (loading) return <Loader message='Chargement du bilan...' />
  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-danger)' }}>
        {error}
      </div>
    )
  }
  if (!bilan) return null

  const BilanTable = ({ titre, entries, total, colorAccent }) => (
    <div
      style={{
        flex: 1,
        minWidth: '300px',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          background: colorAccent,
          color: '#fff',
          padding: '12px 16px',
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '0.05em'
        }}
      >
        {titre}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {Object.entries(entries).length === 0 ? (
            <tr>
              <td
                colSpan={2}
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontStyle: 'italic'
                }}
              >
                Aucun mouvement
              </td>
            </tr>
          ) : (
            Object.entries(entries).map(([compte, details]) => (
              <tr key={compte} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '10px 12px' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: colorAccent,
                      marginRight: '8px'
                    }}
                  >
                    {compte}
                  </span>
                  {details.intitule}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {formatAmount(details.montant)}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr
            style={{
              background: '#f8fafc',
              borderTop: '2px solid var(--color-border)',
              fontWeight: 700
            }}
          >
            <td style={{ padding: '12px' }}>TOTAL</td>
            <td
              style={{
                padding: '12px',
                textAlign: 'right',
                color: colorAccent,
                fontSize: '1rem'
              }}
            >
              {formatAmount(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )

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
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            Bilan Comptable (Système OHADA Simplifié)
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Résultat net : {bilan.resultat >= 0 ? '+' : ''}{formatAmount(bilan.resultat)}
            {' '}(Produits {formatAmount(bilan.totalProduits)} – Charges {formatAmount(bilan.totalCharges)})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button label='Exporter Excel' variant='secondary' className='inscription-action' onClick={exportToExcel} />
          <Button label='Imprimer (PDF)' variant='secondary' className='inscription-action' onClick={handlePrint} />
        </div>
      </div>



      {/* Tableaux Actif / Passif */}
      <div
        style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}
        className='bilan-print-area'
      >
        <BilanTable
          titre='ACTIF (Emplois)'
          entries={bilan.actif}
          total={bilan.totalActif}
          colorAccent='var(--color-secondary, #173f5f)'
        />
        <BilanTable
          titre='PASSIF (Ressources)'
          entries={bilan.passif}
          total={bilan.totalPassif}
          colorAccent='var(--color-secondary, #173f5f)'
        />
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .bilan-print-area, .bilan-print-area * { visibility: visible; }
          .bilan-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default Bilan
