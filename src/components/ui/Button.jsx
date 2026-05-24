import React from 'react'
import './Button.css'

const Button = ({
  id,
  type = 'button',
  label,
  icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  showTail = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'tresoria-btn'
  const variantClass = `${baseClass}--${variant}`
  const disabledClass = disabled || loading ? `${baseClass}--disabled` : ''
  const loadingClass = loading ? `${baseClass}--loading` : ''

  return (
    <button
      id={id}
      type={type}
      className={`${baseClass} ${variantClass} ${disabledClass} ${loadingClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className='btn-spinner' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
        </svg>
      )}
      {!loading && icon && <span className='btn-icon'>{icon}</span>}
      {label && <span className='btn-label'>{label}</span>}

      {showTail && !loading && (
        <div className='btn-tail'>
          <svg width='60' height='50' viewBox='0 0 60 50' fill='none' xmlns='http://www.w3.org/2000/svg'>
            {/* Petit filet à gauche */}
            <path d='M 10,0 C 10,12 11,20 12,22 C 13,20 13,10 14,0 Z' fill='currentColor' />
            {/* Grand filet vers la droite */}
            <path d='M 18,0 C 25,25 40,40 55,48 C 45,40 32,25 28,0 Z' fill='currentColor' />
          </svg>
        </div>
      )}
    </button>
  )
}

export default Button
