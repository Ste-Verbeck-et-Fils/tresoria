import React, { useEffect, useState } from 'react'
import { getJournal } from '../../../../services/comptabiliteService'
import Loader from '../../../../components/ui/Loader'
import Button from '../../../../components/ui/Button'
import { formatAmount } from '../../../inscriptions/utils/amounts'
import * as XLSX from 'xlsx'

const Journal = ({ filters }) => {
  const [ecritures, setEcritures] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedIds, setExpandedIds] = useState(new Set())

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

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isAllExpanded = ecritures && ecritures.length > 0 && expandedIds.size === ecritures.length

  const toggleAll = () => {
    if (isAllExpanded) {
      setExpandedIds(new Set())
    } else {
      if (ecritures) setExpandedIds(new Set(ecritures.map(e => e.id)))
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={toggleAll}
            style={{
              padding: '6px 14px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)'
            }}
          >
            {isAllExpanded ? 'Tout replier' : 'Tout déplier'}
          </button>
          <Button label='Exporter Excel' variant='secondary' className='inscription-action' onClick={exportToExcel} />
          <Button label='Imprimer (PDF)' variant='secondary' className='inscription-action' onClick={handlePrint} />
        </div>
      </div>

      {/* Écritures */}
      <div className='journal-print-area'>
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
            const isOpen = expandedIds.has(e.id)
            const isEquilibre = Math.abs(e.totalDebit - e.totalCredit) < 0.01

            return (
              <div
                key={e.id}
                style={{
                  marginBottom: '24px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                {/* Ligne principale — cliquable */}
                <div
                  onClick={() => toggleExpand(e.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: 'var(--color-info-bg, #DBEAFE)',
                    color: 'var(--color-secondary, #173f5f)',
                    borderRadius: isOpen ? '6px 6px 0 0' : '6px',
                    borderBottom: isOpen ? '2px solid var(--color-secondary, #173f5f)' : 'none',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'background 0.15s'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: 'var(--color-secondary, #173f5f)'
                    }}
                  >
                    {new Date(e.date).toLocaleDateString('fr-FR')} - {e.journal.code}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>
                    {e.libelle} {e.reference ? `(#${e.reference})` : ''}
                  </span>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <span style={{ fontSize: '0.9rem', textAlign: 'right', color: 'var(--color-success, #16a34a)', fontWeight: 700 }}>
                      {formatAmount(e.totalDebit)}
                    </span>
                    <span style={{ fontSize: '0.9rem', textAlign: 'right', color: 'var(--color-danger, #dc2626)', fontWeight: 700 }}>
                      {formatAmount(e.totalCredit)}
                    </span>
                  </div>
                </div>

                {/* Lignes de détail */}
                {isOpen && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>
                            Compte
                          </th>
                          <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700 }}>
                            Libellé ligne
                          </th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>
                            Débit
                          </th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>
                            Crédit
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {e.lignes.map(l => (
                          <tr key={l.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: 'var(--color-secondary, #173f5f)'
                                }}
                              >
                                {l.compte.numero}
                              </span>
                              <span style={{ marginLeft: '8px', color: 'var(--color-text-secondary)' }}>
                                {l.compte.intitule}
                              </span>
                            </td>
                            <td style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
                              {l.libelle}
                            </td>
                            <td
                              style={{
                                padding: '8px 16px',
                                textAlign: 'right',
                                color: l.sens === 'DEBIT' ? 'var(--color-success, #16a34a)' : 'transparent',
                                fontWeight: l.sens === 'DEBIT' ? 600 : 400
                              }}
                            >
                              {l.sens === 'DEBIT' ? formatAmount(l.montant) : '—'}
                            </td>
                            <td
                              style={{
                                padding: '8px 16px',
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
                )}
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
        }
      `}</style>
    </div>
  )
}

export default Journal
