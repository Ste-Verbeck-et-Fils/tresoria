import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, CalendarDays, RefreshCw } from 'lucide-react'
import api from '../../../services/api'
import Loader from '../../../components/ui/Loader'
import ModuleState from '../../inscriptions/components/ModuleState'
import { getStudentName } from '../../inscriptions/utils/data'

const StudentPaiementsPage = () => {
  const { id } = useParams()

  const [student, setStudent] = useState(null)
  const [inscriptions, setInscriptions] = useState([])
  const [selectedInscriptionId, setSelectedInscriptionId] = useState('')

  const [solde, setSolde] = useState(null)
  const [paiements, setPaiements] = useState([])

  const [isLoadingMain, setIsLoadingMain] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMainData = async () => {
      try {
        setIsLoadingMain(true)
        setError('')

        // 1. Charger l'eleve
        const studentRes = await api.get(`/api/students/${id}`)
        setStudent(studentRes.data.data.student)

        // 2. Charger les inscriptions (pour avoir les annees scolaires)
        const inscRes = await api.get(`/api/inscriptions/student/${id}`)
        const inscList = inscRes.data.data.inscriptions || inscRes.data.data || []
        setInscriptions(inscList)

        if (inscList.length > 0) {
          setSelectedInscriptionId(inscList[0].id)
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des donnees.')
      } finally {
        setIsLoadingMain(false)
      }
    }
    fetchMainData()
  }, [id])

  useEffect(() => {
    if (!selectedInscriptionId) return

    const fetchDetails = async () => {
      try {
        setIsLoadingDetails(true)

        // Charger le solde
        const soldeRes = await api.get(`/api/inscriptions/${selectedInscriptionId}/solde`)
        setSolde(soldeRes.data.data?.solde || soldeRes.data.solde || soldeRes.data.data?.inscription?.solde || soldeRes.data.data)

        // Charger l'historique des paiements
        const paiementsRes = await api.get(`/api/paiements/inscription/${selectedInscriptionId}`)
        setPaiements(paiementsRes.data.data.paiements || paiementsRes.data.data || [])
      } catch (err) {
        console.error(err)
        setSolde(null)
        setPaiements([])
      } finally {
        setIsLoadingDetails(false)
      }
    }

    fetchDetails()
  }, [selectedInscriptionId])

  if (isLoadingMain) return <Loader message='Chargement des donnees...' />
  if (error) return <ModuleState type='error' title='Erreur' message={error} actionLabel='Retour' onAction={() => window.history.back()} />

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const soldeData = solde?.solde || solde // handle nested data
  const totalAPayer = soldeData?.total_a_payer || 0
  const totalPaye = soldeData?.total_paye || 0
  const resteAPayer = soldeData?.reste_a_payer || 0

  // Find current inscription to get dette_reportee directly
  const currentInsc = inscriptions.find(i => String(i.id) === String(selectedInscriptionId))
  const detteReportee = currentInsc?.dette_reportee || 0
  const fraisAnnee = currentInsc?.annee_scolaire?.frais || 0

  return (
    <div className='dashboard-page'>
      <header className='dashboard-header' style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to='/students' style={{ color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            Entrées de l'eleve
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}> {getStudentName(student)}</p>
        </div>
      </header>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Filtrer par inscription</label>
            <select
              value={selectedInscriptionId}
              onChange={(e) => setSelectedInscriptionId(e.target.value)}
              style={{ width: '100%', maxWidth: '300px', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
            >
              {inscriptions.map(insc => (
                <option key={insc.id} value={insc.id}>
                  {insc.annee_scolaire?.designation} ({insc.classe?.designation})
                </option>
              ))}
            </select>
          </div>
          {isLoadingDetails && <RefreshCw className='animate-spin' size={20} color='var(--color-text-muted)' />}
        </div>

        {inscriptions.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              Cet eleve n'a aucune inscription.
            </div>
            )
          : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div style={{ background: 'var(--color-light)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Frais de l'annee</p>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text-primary)' }}>{formatMoney(fraisAnnee)}</h3>
                </div>
                <div style={{ background: 'var(--color-light)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Dette reportee</p>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text-primary)' }}>{formatMoney(detteReportee)}</h3>
                </div>
                <div style={{ background: 'var(--color-light)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Total deja paye</p>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text-primary)' }}>{formatMoney(totalPaye)}</h3>
                </div>
                <div style={{ background: resteAPayer > 0 ? 'var(--color-light)' : 'var(--color-light)', padding: '20px', borderRadius: '12px', border: `1px solid ${resteAPayer > 0 ? '#fdba74' : 'var(--color-border)'}` }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: resteAPayer > 0 ? '#c2410c' : 'var(--color-text-muted)' }}>Reste a payer</p>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: resteAPayer > 0 ? '#c2410c' : 'var(--color-text-primary)' }}>{formatMoney(resteAPayer)}</h3>
                </div>
              </div>

              <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--color-secondary)' }}>Historique des entrées</h3>
                {paiements.length === 0
                  ? (
                    <div style={{ textAlign: 'center', padding: '30px', background: 'var(--color-light)', borderRadius: '8px', color: 'var(--color-text-muted)' }}>
                      Aucune entrée n'a été effectuée pour cette annee scolaire.
                    </div>
                    )
                  : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-light)', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>Date</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>Montant</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>Motif</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>Mode</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>Statut</th>
                </tr>
                        </thead>
                        <tbody>
                          {paiements.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '16px' }}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                            <td style={{ padding: '16px', fontWeight: 'bold' }}>{formatMoney(p.montant)}</td>
                            <td style={{ padding: '16px' }}>{p.motif?.replace('_', ' ')}</td>
                            <td style={{ padding: '16px' }}>{p.mode_paiement}</td>
                            <td style={{ padding: '16px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                background: p.statut === 'CONFIRME' ? 'var(--color-success-bg)' : p.statut === 'ANNULE' ? 'var(--color-error-bg)' : '#fef08a',
                                color: p.statut === 'CONFIRME' ? 'var(--color-success)' : p.statut === 'ANNULE' ? 'var(--color-error)' : '#854d0e'
                              }}
                              >
                                {p.statut}
                              </span>
                            </td>
                          </tr>
                ))}
                        </tbody>
                      </table>
                    </div>
                    )}
              </div>
            </>
            )}
      </div>
    </div>
  )
}

export default StudentPaiementsPage
