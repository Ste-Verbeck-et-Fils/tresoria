import React, { useEffect, useState } from 'react'
import { getGrandLivre } from '../../../../services/comptabiliteService'
import Loader from '../../../../components/ui/Loader'
import Button from '../../../../components/ui/Button'
import { formatAmount } from '../../../inscriptions/utils/amounts'
import logoGsEmmanuel from '../../../../assets/images/logo_gsemmanuel.png'
import SearchableSelectField from '../../../inscriptions/components/SearchableSelectField'
import * as XLSX from 'xlsx'

const GrandLivre = ({ filters, compteOptions, onCompteChange }) => {
  const [grandLivre, setGrandLivre] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGrandLivre()
  }, [filters])

  const loadGrandLivre = async () => {
    try {
      setLoading(true)
      setError('')
      const params = {}
      if (filters?.start_date) params.dateDebut = filters.start_date
      if (filters?.end_date) params.dateFin = filters.end_date
      if (filters?.exercice_id) params.exerciceId = filters.exercice_id
      if (filters?.journal_id) params.journalId = filters.journal_id
      if (filters?.compte_id) params.compteId = filters.compte_id
      const payload = await getGrandLivre(params)
      if (payload.success) setGrandLivre(payload.data)
      else setError('Impossible de charger le grand livre.')
    } catch (e) {
      console.error(e)
      setError('Erreur lors du chargement du grand livre.')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (!grandLivre) return
    const rows = grandLivre.map(l => ({
      Date: new Date(l.date).toLocaleDateString('fr-FR'),
      Journal: l.journal,
      Référence: l.reference || '',
      'Compte N°': l.compte.numero,
      'Intitulé compte': l.compte.intitule,
      Libellé: l.libelle,
      Débit: l.debit || '',
      Crédit: l.credit || '',
      'Solde cumulé': l.solde
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Grand Livre')
    XLSX.writeFile(workbook, 'grand_livre.xlsx')
  }

  const handlePrint = () => window.print()

  // Grouper les lignes par compte pour l'affichage
  const comptesSections = React.useMemo(() => {
    if (!grandLivre) return []
    const map = {}
    grandLivre.forEach(l => {
      const num = l.compte.numero
      if (!map[num]) {
        map[num] = { compte: l.compte, lignes: [] }
      }
      map[num].lignes.push(l)
    })
    return Object.values(map).sort((a, b) => a.compte.numero.localeCompare(b.compte.numero))
  }, [grandLivre])

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
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Grand Livre Comptable</h2>
          {grandLivre && (
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {grandLivre.length} ligne{grandLivre.length !== 1 ? 's' : ''}
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

      {/* Contenu */}
      {loading ? (
        <Loader message='Chargement du grand livre...' />
      ) : error ? (
        <div style={{ textAlign: 'center', color: 'var(--color-danger)', padding: '24px' }}>{error}</div>
      ) : (
        <div className='grand-livre-print-area'>
          {/* En-tête visible uniquement lors de l'impression */}
          <div className='reporting-print-header' style={{ display: 'none' }}>
            <img src={logoGsEmmanuel} alt='Logo GS Emmanuel' style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>GS EMMANUEL SAUVE</h1>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#475569' }}>
                Rapport Comptable - Grand Livre (Généré le {new Date().toLocaleDateString('fr-FR')})
              </p>
            </div>
          </div>
          {comptesSections.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                background: '#f8fafc',
                borderRadius: '8px'
              }}
            >
              Aucune écriture trouvée.
            </div>
          ) : (
            comptesSections.map(({ compte, lignes }) => {
              const totalDebit = lignes.reduce((s, l) => s + l.debit, 0)
              const totalCredit = lignes.reduce((s, l) => s + l.credit, 0)
              const soldeFinal = lignes[lignes.length - 1]?.solde ?? 0

              return (
                <div key={compte.numero} style={{ marginBottom: '24px' }}>
                  {/* Titre du compte */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      background: 'var( #d4ddeaff)',
                      color: 'var(--color-secondary, #173f5f)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      borderRadius: '6px 6px 0 0',
                      borderBottom: '2px solid var(--color-secondary, #173f5f)'
                    }}
                  >
                    <span style={{ fontFamily: 'monospace' }}>
                      {compte.numero}
                    </span>
                    <span>
                      {compte.intitule}
                    </span>
                  </div>

                  {/* Table des mouvements */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Date</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Jrn</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Réf</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Libellé</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Débit</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Crédit</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Solde cumulé</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lignes.map((l, i) => (
                          <tr
                            key={i}
                            style={{ borderBottom: '1px solid var(--color-border)' }}
                          >
                            <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                              {new Date(l.date).toLocaleDateString('fr-FR')}
                            </td>
                            <td style={{ padding: '8px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                              {l.journal}
                            </td>
                            <td style={{ padding: '8px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                              {l.reference || '—'}
                            </td>
                            <td style={{ padding: '8px' }}>{l.libelle}</td>
                            <td
                              style={{
                                padding: '8px 12px',
                                textAlign: 'right',
                                color: l.debit > 0 ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)',
                                fontWeight: l.debit > 0 ? 600 : 400
                              }}
                            >
                              {l.debit > 0 ? formatAmount(l.debit) : '—'}
                            </td>
                            <td
                              style={{
                                padding: '8px 12px',
                                textAlign: 'right',
                                color: l.credit > 0 ? 'var(--color-danger, #dc2626)' : 'var(--color-text-muted)',
                                fontWeight: l.credit > 0 ? 600 : 400
                              }}
                            >
                              {l.credit > 0 ? formatAmount(l.credit) : '—'}
                            </td>
                            <td
                              style={{
                                padding: '8px 12px',
                                textAlign: 'right',
                                fontWeight: 700,
                                color: l.solde >= 0 ? 'var(--color-text-primary)' : 'var(--color-danger, #dc2626)'
                              }}
                            >
                              {formatAmount(l.solde)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f1f5f9', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                          <td colSpan={4} style={{ padding: '8px 12px' }}>Totaux</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-success, #16a34a)' }}>
                            {formatAmount(totalDebit)}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-danger, #dc2626)' }}>
                            {formatAmount(totalCredit)}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: soldeFinal >= 0 ? 'var(--color-text-primary)' : 'var(--color-danger, #dc2626)' }}>
                            {formatAmount(soldeFinal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .grand-livre-print-area, .grand-livre-print-area * { visibility: visible; }
          .grand-livre-print-area { position: absolute; left: 0; top: 0; width: 100%; }
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

export default GrandLivre
