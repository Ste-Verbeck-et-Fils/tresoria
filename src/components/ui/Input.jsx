import React from 'react'
import './Input.css'

const Input = ({
  id,
  type = 'text',
  label,
  placeholder,
  value,
  icon,
  variant = 'default',
  disabled = false,
  error,
  onChange,
  className = '',
  ...props
}) => {
  const baseClass = 'tresoria-input'

  // Use placeholder or label as the floating text
  const floatingText = placeholder || label

  if (variant === 'textarea') {
    return (
      <div className={`input-container ${className}`}>
        <div className='input-wrapper-relative'>
          <textarea
            id={id}
            className={`${baseClass} ${baseClass}--textarea ${error ? 'input--error' : ''}`}
            placeholder=' '
            value={value}
            disabled={disabled}
            onChange={onChange}
            {...props}
          />
          {floatingText && (
            <label htmlFor={id} className='floating-label'>
              {floatingText}
            </label>
          )}
        </div>
        {error && <span className='input-error-message'>{error}</span>}
      </div>
    )
  }

  return (
    <div className={`input-container ${variant === 'searchbox' ? 'container--searchbox' : ''} ${className}`}>

      <div className={`input-wrapper ${variant === 'searchbox' ? 'wrapper--searchbox' : ''} ${error ? 'wrapper--error' : ''} ${disabled ? 'wrapper--disabled' : ''}`}>
        {/* Left icon for default variants */}
        {icon && variant !== 'searchbox' && <span className='input-icon-left'>{icon}</span>}

        <input
          id={id}
          type={type}
          className={`${baseClass} ${variant === 'searchbox' ? 'input--searchbox' : ''}`}
          placeholder={variant === 'searchbox' ? placeholder : ' '}
          value={value}
          disabled={disabled}
          onChange={onChange}
          {...props}
        />

        {variant !== 'searchbox' && floatingText && (
          <label htmlFor={id} className={`floating-label ${icon ? 'floating-label--with-icon' : ''}`}>
            {floatingText}
          </label>
        )}

        {/* Right element for searchbox (usually an arrow button/icon) */}
        {variant === 'searchbox' && icon && (
          <div className='input-icon-right-action'>
            {icon}
          </div>
        )}
      </div>

      {error && <span className='input-error-message'>{error}</span>}
    </div>
  )
}

export default Input
