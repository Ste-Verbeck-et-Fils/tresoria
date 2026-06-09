import React from 'react'

const StatusBadge = ({ value }) => {
  const status = value || '-'
  const normalizedStatus = status.toLowerCase().replace(/_/g, '-')

  return (
    <span
      className={`inscription-status inscription-status--${normalizedStatus}`}
      style={{ backgroundColor: 'transparent' }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default StatusBadge
