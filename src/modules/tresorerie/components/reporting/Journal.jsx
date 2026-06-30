import React, { useEffect, useState } from 'react'
import { getJournal } from '../../../../services/comptabiliteService'
import Loader from '../../../../components/ui/Loader'
import Button from '../../../../components/ui/Button'
import { formatAmount } from '../../../inscriptions/utils/amounts'
import logoGsEmmanuel from '../../../../assets/images/logo_gsemmanuel.png'
import SearchableSelectField from '../../../inscriptions/components/SearchableSelectField'
import * as XLSX from 'xlsx'

const Journal = ({ filters, compteOptions, onCompteChange }) => {
  const [ecritures, setEcritures] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadJournal()
  }, [filters])

  const loadJournal = async () => {
    try {
      setLoading(true)
      setError('')
      const params = {}
      if (filters?.start_date) params.dateDebut = filters.start_date
      if (filters?.end_date) params.dateFin = filters.end_date
      if (filters?.journal_id) params.journalId = filters.journal_id
      if (filters?.exercice_id) params.exerciceId = filters.exercice_id
      if (filters?.compte_id) params.compteId = filters.compte_id

      const payload = await getJournal(params)
      if (payload.success) setEcritures(payload.data)
      else setError('Impossible de charger le journal.')
    } catch (e) {
      console.error(e)
      setError('Erreur lors du chargement du journal.')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (!ecritures) return
    const rows = []
    ecritures.forEach(e => {
      const dateStr = new Date(e.date).toLocaleDateString('fr-FR')
      e.lignes.forEach(l => {
        rows.push({
          Date: dateStr,
          'Réf. écriture': e.id,
          Journal: e.journal.code,
          Référence: e.reference || '',
          Libellé: e.libelle,
          Compte: l.compte.numero,
          'Intitulé compte': l.compte.intitule,
          Sens: l.sens,
          Débit: l.sens === 'DEBIT' ? l.montant : '',
          Crédit: l.sens === 'CREDIT' ? l.montant : ''
        })
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Journal')
    XLSX.writeFile(workbook, 'journal_comptable.xlsx')
  }

  const handlePrint = () => window.print()

  if (loading) return <Loader message='Chargement du journal...' />

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-danger)' }}>
        {error}
      </div>
    )
  }

  if (!ecritures) return null

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
          <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Journal Comptable</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {ecritures.length} écriture{ecritures.length !== 1 ? 's' : ''}
          </p>
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

      {/* Écritures */}
      <div className='journal-print-area' style={{ overflowX: 'auto' }}>
        {/* En-tête visible uniquement lors de l'impression */}
        <div className='reporting-print-header' style={{ display: 'none' }}>
          <img src={logoGsEmmanuel} alt='Logo GS Emmanuel' style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>GS EMMANUEL SAUVE</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#475569' }}>
              Rapport Comptable - Journal (Généré le {new Date().toLocaleDateString('fr-FR')})
            </p>
          </div>
        </div>
        {ecritures.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              background: '#f8fafc',
              borderRadius: '8px'
            }}
          >
            Aucune écriture trouvée sur cette période.
          </div>
        ) : (
          ecritures.map(e => {
            return (
              <div key={e.id} style={{ marginBottom: '24px' }}>
                {/* En-tête de l'écriture */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var( #d4ddeaff)',
                    color: 'var(--color-secondary, #173f5f)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    borderRadius: '6px 6px 0 0',
                    borderBottom: '2px solid var(--color-secondary, #173f5f)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: 'monospace' }}>
                      {new Date(e.date).toLocaleDateString('fr-FR')} - {e.journal.code}
                    </span>
                    <span>
                      {e.libelle} {e.reference ? `(#${e.reference})` : ''}
                    </span>
                  </div>
                </div>

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Compte</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Libellé ligne</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Débit</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Crédit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.lignes.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700 }}>
                          {l.compte.numero} <span style={{ fontFamily: 'inherit', fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>{l.compte.intitule}</span>
                        </td>
                        <td style={{ padding: '8px' }}>
                          {l.libelle}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            textAlign: 'right',
                            color: l.sens === 'DEBIT' ? 'var(--color-success, #16a34a)' : 'transparent',
                            fontWeight: l.sens === 'DEBIT' ? 600 : 400
                          }}
                        >
                          {l.sens === 'DEBIT' ? formatAmount(l.montant) : '—'}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            textAlign: 'right',
                            color: l.sens === 'CREDIT' ? 'var(--color-danger, #dc2626)' : 'transparent',
                            fontWeight: l.sens === 'CREDIT' ? 600 : 400
                          }}
                        >
                          {l.sens === 'CREDIT' ? formatAmount(l.montant) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f1f5f9', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                      <td colSpan={2} style={{ padding: '8px 12px' }}>Total écriture</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-success, #16a34a)' }}>
                        {formatAmount(e.totalDebit)}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-danger, #dc2626)' }}>
                        {formatAmount(e.totalCredit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          })
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .journal-print-area, .journal-print-area * { visibility: visible; }
          .journal-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .reporting-print-header {
            display: flex !important;
            align-items: center;
            gap: 16px;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
        }
      `}
      </style>
    </div>
  )
}

export default Journal
