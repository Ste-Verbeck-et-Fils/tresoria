import React from 'react'
import logoGsEmmanuel from '../../../assets/images/logo_gsemmanuel.png'

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
    <>
      <div className='print-only' style={{ marginBottom: '20px' }}>
        <div className='print-header' style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '15px', borderBottom: '2px solid #000' }}>
          <img src={logoGsEmmanuel} alt='Logo GS Emmanuel' style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '22px', margin: 0, fontWeight: 'bold', color: '#0f172a' }}>GS EMMANUEL SAUVE</h1>
            <h2 style={{ fontSize: '15px', margin: '4px 0 0', fontWeight: '500', color: '#1e293b' }}>Information - {title}</h2>
          </div>
        </div>
      </div>
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
    </>
  )
}

export default DetailSummaryCard
