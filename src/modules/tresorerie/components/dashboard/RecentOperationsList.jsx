import React from 'react';
import { formatAmount } from '../../../inscriptions/utils/amounts';

const RecentOperationsList = ({ operations }) => {
  if (!operations || operations.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Aucune opération récente.</div>;
  }

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'CONFIRME': return { bg: '#DEF7EC', color: '#03543F' };
      case 'EN_ATTENTE': return { bg: '#FEF3C7', color: '#92400E' };
      case 'ANNULE': return { bg: '#FDE8E8', color: '#9B1C1C' };
      default: return { bg: '#E5E7EB', color: '#374151' };
    }
  };

  return (
    <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>Dernières Opérations</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {operations.map((op, idx) => {
          const isEntree = op.type === 'ENTREE';
          const statusStyle = getStatusColor(op.statut);
          
          return (
            <div key={op.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: idx !== operations.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{op.titre}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(op.date).toLocaleDateString()} • {op.mode}
                  </span>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color
                  }}>
                    {op.statut}
                  </span>
                </div>
              </div>
              
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: isEntree ? '#10B981' : 'var(--color-text-primary)' }}>
                {isEntree ? '+' : '-'}{formatAmount(op.montant)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentOperationsList;
