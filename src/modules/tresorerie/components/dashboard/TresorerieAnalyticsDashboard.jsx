import React, { useEffect, useState } from 'react'
import { dashboardService } from '../../../../services/dashboardService'
import KPICard from './KPICard'
import CashFlowChart from './CashFlowChart'
import Loader from '../../../../components/ui/Loader'
import Feedback from '../../../../components/ui/Feedback'

const TresorerieAnalyticsDashboard = ({ filters }) => {
  const [data, setData] = useState({
    kpis: null,
    cashFlow: [],
    expenses: [],
    recentOperations: [],
    anomalies: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError('')
      try {
        const params = {}
        if (filters.annee_scolaire_id) params.annee_scolaire_id = filters.annee_scolaire_id
        if (filters.start_date) params.dateDebut = filters.start_date
        if (filters.end_date) params.dateFin = filters.end_date

        const [kpis, cashFlow, anomalies] = await Promise.all([
          dashboardService.getKpis(params),
          dashboardService.getCashFlow(params),
          dashboardService.getAnomalies(params)
        ])

        setData({ kpis, cashFlow, anomalies })
      } catch (err) {
        console.error(err)
        setError('Impossible de charger les données analytiques du dashboard.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [filters])

  if (isLoading) return <Loader message='Chargement des analyses en cours...' />
  if (error) return <Feedback type='error' message={error} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>

      {/* 1. Indicateurs de Performance (KPIs) */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <KPICard
          title='Solde global actuel'
          amount={data.kpis?.soldeGlobal}

        />
        <KPICard
          title='Total Entrées'
          amount={data.kpis?.totalEntrees}

        />
        <KPICard
          title='Total Sorties'
          amount={data.kpis?.totalSorties}

        />
        <KPICard
          title='Reste à percevoir'
          amount={data.kpis?.resteAPercevoir}

        />
      </div>

      {/* 2. Visualisation des Flux */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 100%', minWidth: 0 }}>
          <CashFlowChart data={data.cashFlow} />
        </div>
      </div>

      {/* 3. Anomalies */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {data.anomalies && data.anomalies.length > 0 && (
          <div style={{ flex: '1 1 300px', background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid #FCA5A5' }}>
            <h3 style={{ color: '#DC2626', marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>Anomalies Détectées</h3>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.anomalies.map(an => (
                <li key={an.id} style={{ color: 'var(--color-text-primary)' }}>
                  {an.description} - <strong>{an.montant} USD</strong><br />
                  <small style={{ color: 'var(--color-text-muted)' }}>{new Date(an.date).toLocaleDateString()}</small>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

    </div>
  )
}

export default TresorerieAnalyticsDashboard
