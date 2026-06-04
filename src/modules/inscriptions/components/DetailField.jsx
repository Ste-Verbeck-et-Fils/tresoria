import React from 'react'

const DetailField = ({ label, value }) => {
  const displayValue = value === null || value === undefined || value === ''
    ? 'Non renseigne'
    : value

  return (
    <div className='inscription-detail-field'>
      <dt>{label}</dt>
      <dd>{displayValue}</dd>
    </div>
  )
}

export default DetailField
