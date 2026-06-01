import React from 'react'

const DetailSection = ({ title, actions, children }) => {
  return (
    <article className='detail-section-card'>
      <header className='detail-section-card__header'>
        <h2>{title}</h2>
        {actions && <div className='detail-section-card__actions'>{actions}</div>}
      </header>

      <dl className='inscription-detail-grid'>
        {children}
      </dl>
    </article>
  )
}

export default DetailSection
