import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CashFlowChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Aucune donnée de flux disponible.</div>;
  }

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Sorties',
        data: data.map(d => d.sorties),
        borderColor: '#173f5f',
        backgroundColor: '#173f5f33',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#173f5f',
      },
      {
        label: 'Entrées',
        data: data.map(d => d.entrees),
        borderColor: '#26B6FF',
        backgroundColor: '#26B6FF33',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#26B6FF',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', height: '400px', width: '100%' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>Flux de trésorerie</h3>
      <div style={{ position: 'relative', height: '320px', width: '100%' }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
};

export default CashFlowChart;
