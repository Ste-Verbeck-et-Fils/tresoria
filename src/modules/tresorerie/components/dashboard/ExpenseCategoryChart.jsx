import React from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, DoughnutController, Tooltip, Legend)

const ExpenseCategoryChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Aucune dépense disponible.</div>
  }

  // Predefined colors for categories
  const colors = [
    '#173f5f', '#26B6FF', '#1f5b8a', '#5bc0de', '#10304a',
    '#0b2031', '#7dcbf2', '#0f2f49', '#3ba5e0', '#1c4a70'
  ]

  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        data: data.map(d => d.value),
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
    },
    cutout: '70%',
  }

  return (
    <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', height: '400px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>Répartition des Dépenses</h3>
      <div style={{ height: '320px', display: 'flex', justifyContent: 'center' }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  )
}

export default ExpenseCategoryChart
