import React from 'react'

const DetailField = ({ label, value }) => {
  return (
    <div className='inscription-detail-field'>
      <dt>{label}</dt>
      <dd>{value || 'Non renseigne'}</dd>
    </div>
  )
}

export default DetailField
