import React from 'react';
import { formatAmount } from '../../../inscriptions/utils/amounts';

const KPICard = ({ title, amount, isTotal = false, subtitle }) => {
  return (
    <div style={{
      background: isTotal ? 'var(--color-secondary)' : 'var(--color-surface)',
      color: isTotal ? '#ffffff' : 'var(--color-text-primary)',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: '180px',
      flex: 1,
      border: isTotal ? 'none' : '1px solid var(--color-border)',
      transition: 'transform 0.2s',
      cursor: 'default'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <span style={{ fontSize: '0.85rem', color: isTotal ? '#e2e8f0' : 'var(--color-text-muted)' }}>
        {title}
      </span>
      <strong style={{ fontSize: '1.4rem', fontWeight: 700 }}>
        {formatAmount(amount || 0)}
      </strong>
      {subtitle && (
        <span style={{ fontSize: '0.75rem', color: isTotal ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
};

export default KPICard;
