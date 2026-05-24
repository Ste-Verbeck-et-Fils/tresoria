import React from 'react'
import './FeatureCard.css'

const FeatureCard = ({
  title,
  description,
  image,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`feature-card ${className}`} {...props}>
      <div className='feature-card__image-wrapper'>
        <img src={image} alt={title} className='feature-card__image' loading='lazy' />
        {icon && (
          <div className='feature-card__icon-badge'>
            {icon}
          </div>
        )}
      </div>
      <div className='feature-card__body'>
        <h3 className='feature-card__title'>{title}</h3>
        <p className='feature-card__description'>{description}</p>
      </div>
    </div>
  )
}

export default FeatureCard
