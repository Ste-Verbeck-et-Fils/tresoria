import React, { useEffect, useState, useMemo } from 'react'
import { getPaiements } from '../../../../services/paiementService'
import { getDepenses } from '../../../../services/depenseService'
import Loader from '../../../../components/ui/Loader'
import Button from '../../../../components/ui/Button'
import { formatAmount } from '../../../inscriptions/utils/amounts'
import logoGsEmmanuel from '../../../../assets/images/logo_gsemmanuel.png'
import * as XLSX from 'xlsx'

const RapportJournalier = ({ filters }) => {
  const [payments, setPayments] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const startDate = filters?.start_date || todayStr
  const endDate = filters?.end_date || todayStr

  useEffect(() => {
    loadData()
  }, [filters, todayStr])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const queryParams = {
        start_date: startDate ? `${startDate}T00:00:00.000` : undefined,
        end_date: endDate ? `${endDate}T23:59:59.999` : undefined,
        ...(filters?.annee_scolaire_id ? { annee_scolaire_id: filters.annee_scolaire_id } : {})
      }

      const [paymentsResponse, expensesResponse] = await Promise.all([
        getPaiements(queryParams),
        getDepenses(queryParams)
      ])

      const paymentsList = paymentsResponse?.data?.paiements || paymentsResponse?.paiements || paymentsResponse || []
      const expensesList = expensesResponse?.data?.depenses || expensesResponse?.depenses || expensesResponse || []

      // Filter only CONFIRMED items for accounting reporting
      setPayments(paymentsList.filter(p => p.statut === 'CONFIRME'))
      setExpenses(expensesList.filter(e => e.statut === 'CONFIRME'))
    } catch (e) {
      console.error(e)
      setError('Erreur lors du chargement des données du rapport journalier.')
    } finally {
      setLoading(false)
    }
  }

  // Groups
  const groupedData = useMemo(() => {
    const groups = {
      fraisScolaires: [],
      fraisTransport: [],
      fraisEtat: [],
      litiges: [],
      depenses: []
    }

    payments.forEach(p => {
      const motif = p.motif || p.type
      if (motif === 'FRAIS_SCOLAIRE' || motif === 'FRAIS_ETUDE') {
        groups.fraisScolaires.push(p)
      } else if (motif === 'FRAIS_TRANSPORT') {
        groups.fraisTransport.push(p)
      } else if (motif === 'FRAIS_ETAT') {
        groups.fraisEtat.push(p)
      } else {
        // AUTRE and anything else falls into litigation/others as requested
        groups.litiges.push(p)
      }
    })

    groups.depenses = expenses

    // Calculate subtotals
    const sum = (list) => list.reduce((acc, item) => acc + Number(item.montant || item.amount || 0), 0)

    const subtotals = {
      fraisScolaires: sum(groups.fraisScolaires),
      fraisTransport: sum(groups.fraisTransport),
      fraisEtat: sum(groups.fraisEtat),
      litiges: sum(groups.litiges),
      depenses: sum(groups.depenses)
    }

    const totalRecette = subtotals.fraisScolaires + subtotals.fraisTransport + subtotals.fraisEtat + subtotals.litiges
    const netTotal = totalRecette - subtotals.depenses

    return { groups, subtotals, netTotal }
  }, [payments, expenses])

  const handlePrint = () => window.print()

  const handleExportExcel = () => {
    const tableEl = document.getElementById('table-rapport-journalier')
    if (!tableEl) return
    const ws = XLSX.utils.table_to_sheet(tableEl)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport Journalier')
    XLSX.writeFile(wb, `Rapport_Journalier_${startDate}.xlsx`)
  }

  const getStudentName = (payment) => {
    const student = payment.inscription?.student || payment.student
    if (!student) return '-'
    return `${student.nom || ''} ${student.postnom || ''} ${student.prenom || ''}`.trim().toUpperCase()
  }

  const getClasseName = (payment) => {
    return payment.inscription?.classe?.designation || '-'
  }

  const getReceiptLabel = (payment) => {
    return payment.reference || `#${payment.id}`
  }

  if (loading) return <Loader message='Chargement du rapport journalier...' />

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-danger)' }}>
        {error}
      </div>
    )
  }

  const formattedDateRange = () => {
    const opt = { day: 'numeric', month: 'long', year: 'numeric' }
    const start = new Date(startDate).toLocaleDateString('fr-FR', opt)
    const end = new Date(endDate).toLocaleDateString('fr-FR', opt)
    return start === end ? `le ${start}` : `du ${start} au ${end}`
  }

  const { groups, subtotals, netTotal } = groupedData

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
      {/* Action Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
        className='no-print'
      >
        <div>
          <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Rapport Journalier de Caisse</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Synthèse journalière {formattedDateRange()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button label='Exporter Excel' variant='secondary' className='inscription-action' onClick={handleExportExcel} />
          <Button label='Imprimer (PDF)' variant='secondary' className='inscription-action' onClick={handlePrint} />
        </div>
      </div>

      <div className='rapport-journalier-print-area'>
        {/* En-tête d'impression */}
        <div className='reporting-print-header' style={{ display: 'none' }}>
          <img src={logoGsEmmanuel} alt='Logo GS Emmanuel' style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>GS EMMANUEL SAUVE</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#475569' }}>
              Rapport Comptable - Rapport Journalier de Caisse ({formattedDateRange()})
            </p>
          </div>
        </div>

        {/* Tableau Unique Structuré */}
        <table id='table-rapport-journalier' style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <tbody>

            {/* 1. FRAIS SCOLAIRE */}
            <tr className='report-category-title-row'>
              <td colSpan={5} style={{ padding: '10px 8px', border: '1px solid var(--color-border)' }}>
                I. FRAIS SCOLAIRE
              </td>
            </tr>
            <tr style={{ background: '#f8fafc', fontWeight: '700', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '6%' }}>N°</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '38%' }}>Noms</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '26%' }}>Libellé (N° Reçu)</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '15%' }}>Classe</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '15%', textAlign: 'right' }}>Montant</td>
            </tr>
            {groups.fraisScolaires.length === 0
              ? (
                <tr>
                  <td colSpan={4} style={{ padding: '8px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucune transaction</td>
                  <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right', fontWeight: '500' }}>0,00 $</td>
                </tr>
                )
              : (
                  groups.fraisScolaires.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{getStudentName(p)}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{getReceiptLabel(p)}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{getClasseName(p)}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>{formatAmount(p.montant)}</td>
                    </tr>
                  ))
                )}
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td colSpan={4} style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>SOUS TOTAL FRAIS SCOLAIRE</td>
              <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>{formatAmount(subtotals.fraisScolaires)}</td>
            </tr>

            {/* 2. FRAIS TRANSPORT */}
            <tr className='report-category-title-row'>
              <td colSpan={5} style={{ padding: '10px 8px', border: '1px solid var(--color-border)', borderTop: '2px solid var(--color-border)' }}>
                II. FRAIS TRANSPORT
              </td>
            </tr>
            <tr style={{ background: '#f8fafc', fontWeight: '700', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '6%' }}>N°</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '38%' }}>Noms</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '26%' }}>Libellé (N° Reçu)</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '15%' }}>Classe</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '15%', textAlign: 'right' }}>Montant</td>
            </tr>
            {groups.fraisTransport.length === 0
              ? (
                <tr>
                  <td colSpan={4} style={{ padding: '8px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucune transaction</td>
                  <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right', fontWeight: '500' }}>0,00 $</td>
                </tr>
                )
              : (
                  groups.fraisTransport.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{getStudentName(p)}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{getReceiptLabel(p)}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{getClasseName(p)}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>{formatAmount(p.montant)}</td>
                    </tr>
                  ))
                )}
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td colSpan={4} style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>SOUS TOTAL FRAIS TRANSPORT</td>
              <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>{formatAmount(subtotals.fraisTransport)}</td>
            </tr>

            {/* 3. FRAIS D'ETAT */}
            <tr className='report-category-title-row'>
              <td colSpan={5} style={{ padding: '10px 8px', border: '1px solid var(--color-border)', borderTop: '2px solid var(--color-border)' }}>
                III. FRAIS D'ETAT
              </td>
            </tr>
            <tr style={{ background: '#f8fafc', fontWeight: '700', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '6%' }}>N°</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '38%' }}>Noms</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '26%' }}>Libellé (N° Reçu)</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '15%' }}>Classe</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '15%', textAlign: 'right' }}>Montant</td>
            </tr>
            {groups.fraisEtat.length === 0
              ? (
                <tr>
                  <td colSpan={4} style={{ padding: '8px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucune transaction</td>
                  <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right', fontWeight: '500' }}>0,00 $</td>
                </tr>
                )
              : (
                  groups.fraisEtat.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{getStudentName(p)}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{getReceiptLabel(p)}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{getClasseName(p)}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>{formatAmount(p.montant)}</td>
                    </tr>
                  ))
                )}
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td colSpan={4} style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>SOUS TOTAL FRAIS D'ETAT</td>
              <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>{formatAmount(subtotals.fraisEtat)}</td>
            </tr>

            {/* 4. PAIEMENT DES LITIGES */}
            <tr className='report-category-title-row'>
              <td colSpan={5} style={{ padding: '10px 8px', border: '1px solid var(--color-border)', borderTop: '2px solid var(--color-border)' }}>
                IV. PAIEMENT DES LITIGES / AUTRES
              </td>
            </tr>
            <tr style={{ background: '#f8fafc', fontWeight: '700', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '6%' }}>N°</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '38%' }}>Noms</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '26%' }}>Libellé (N° Reçu)</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '15%' }}>Classe</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '15%', textAlign: 'right' }}>Montant</td>
            </tr>
            {groups.litiges.length === 0
              ? (
                <tr>
                  <td colSpan={4} style={{ padding: '8px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucune transaction</td>
                  <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right', fontWeight: '500' }}>0,00 $</td>
                </tr>
                )
              : (
                  groups.litiges.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{getStudentName(p)}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{getReceiptLabel(p)}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{getClasseName(p)}</td>
                      <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>{formatAmount(p.montant)}</td>
                    </tr>
                  ))
                )}
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td colSpan={4} style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>SOUS TOTAL PAIEMENT DES LITIGES</td>
              <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>{formatAmount(subtotals.litiges)}</td>
            </tr>

            {/* 5. DEPENSES JOURNALIERES */}
            <tr className='report-category-title-row'>
              <td colSpan={5} style={{ padding: '10px 8px', border: '1px solid var(--color-border)', borderTop: '2px solid var(--color-border)' }}>
                V. DEPENSES JOURNALIERES
              </td>
            </tr>
            <tr style={{ background: '#f8fafc', fontWeight: '700', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '6%' }}>N°</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '38%' }}>Noms</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '26%' }}>Libellé (N° Reçu)</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '15%' }}>Classe</td>
              <td style={{ padding: '6px 8px', border: '1px solid var(--color-border)', width: '15%', textAlign: 'right' }}>Montant</td>
            </tr>
            {groups.depenses.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '8px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucune dépense</td>
                <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right', fontWeight: '500' }}>0,00 $</td>
              </tr>
            ) : (
              groups.depenses.map((e, idx) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{idx + 1}</td>
                  {/* Leave space for name empty */}
                  <td style={{ padding: '8px', border: '1px solid var(--color-border)' }} />
                  <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>
                    {e.reference ? `${e.reference} - ` : ''}{e.libelle || e.description}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid var(--color-border)' }}>{e.categorie || '-'}</td>
                  <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>{formatAmount(e.montant)}</td>
                </tr>
              ))
            )}
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td colSpan={4} style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>SOUS TOTAL DEPENSES JOURNALIERES</td>
              <td style={{ padding: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>{formatAmount(subtotals.depenses)}</td>
            </tr>

            {/* 6. SOLDE NET */}
            <tr style={{ background: '#f1f5f9', fontWeight: '800', borderTop: '2px solid var(--color-border)' }}>
              <td colSpan={4} style={{ padding: '12px 8px', border: '1px solid var(--color-border)', textAlign: 'right', fontSize: '0.95rem' }}>
                VI. MONTANT TOTAL RECU APRES DEPENSES (NET)
              </td>
              <td style={{ padding: '12px 8px', border: '1px solid var(--color-border)', textAlign: 'right', fontSize: '1rem', color: netTotal >= 0 ? '#1e293b' : '#991b1b' }}>
                {formatAmount(netTotal)}
              </td>
            </tr>

          </tbody>
        </table>

        {/* Zones de Signatures */}
        <div className='reporting-signatures'>
          <div className='signature-box'>
            <span>Le Service Comptable</span>
            <div className='signature-line' />
          </div>
          <div className='signature-box'>
            <span>Le Visa Gestionnaire</span>
            <div className='signature-line' />
          </div>
        </div>
      </div>

      <style>{`
        .report-category-title-row {
          background: transparent;
          color: var(--color-secondary, #173f5f);
          font-weight: bold;
        }
        @media print {
          body * { visibility: hidden; }
          .rapport-journalier-print-area, .rapport-journalier-print-area * { visibility: visible; }
          .rapport-journalier-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .reporting-print-header {
            display: flex !important;
            align-items: center;
            gap: 16px;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .rapport-journalier-print-area table td {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}
      </style>
    </div>
  )
}

export default RapportJournalier
