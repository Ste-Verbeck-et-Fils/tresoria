import React from 'react'

const DetailSummaryCard = ({
  icon,
  imageUrl,
  imageAlt = '',
  title,
  subtitle,
  meta,
  badge,
}) => {
  return (
    <article className='detail-summary-card'>
      <div className='detail-summary-card__visual'>
        {imageUrl
          ? <img src={imageUrl} alt={imageAlt || title} className='detail-summary-card__image' />
          : icon}
      </div>

      <div className='detail-summary-card__content'>
        <div className='detail-summary-card__title-line'>
          <h2>{title}</h2>
          {badge}
        </div>
        {subtitle && <p className='detail-summary-card__subtitle'>{subtitle}</p>}
        {meta && <p className='detail-summary-card__meta'>{meta}</p>}
      </div>
    </article>
  )
}

export default DetailSummaryCard
