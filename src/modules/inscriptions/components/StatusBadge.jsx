import React from 'react'

const StatusBadge = ({ value }) => {
  const status = value || 'NON RENSEIGNE'
  const normalizedStatus = status.toLowerCase().replace(/_/g, '-')

  return (
    <span className={`inscription-status inscription-status--${normalizedStatus}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default StatusBadge
