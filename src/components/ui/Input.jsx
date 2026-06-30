import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { AsYouType } from 'libphonenumber-js'
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
  onSearch,
  searchActionLabel = 'Rechercher',
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const baseClass = 'tresoria-input'

  // Use placeholder or label as the floating text
  const floatingText = placeholder || label
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type

  const handleChange = (e) => {
    if (type === 'tel') {
      const formatter = new AsYouType('CD')
      e.target.value = formatter.input(e.target.value)
    }
    if (onChange) onChange(e)
  }

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
          type={inputType}
          className={`${baseClass} ${variant === 'searchbox' ? 'input--searchbox' : ''} ${type === 'password' ? 'input--password' : ''}`}
          placeholder={variant === 'searchbox' ? placeholder : ' '}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />

        {variant !== 'searchbox' && floatingText && (
          <label htmlFor={id} className={`floating-label ${icon ? 'floating-label--with-icon' : ''}`}>
            {floatingText}
          </label>
        )}

        {/* Searchboxes keep their action visually separate from the text field. */}
        {variant === 'searchbox' && icon && (
          <button
            type='button'
            className='input-icon-right-action'
            aria-label={searchActionLabel}
            disabled={disabled}
            onClick={() => onSearch?.(value)}
          >
            {icon}
          </button>
        )}

        {/* Password toggle icon */}
        {type === 'password' && (
          <button
            type='button'
            className='input-password-toggle'
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <span className='input-error-message'>{error}</span>}
    </div>
  )
}

export default Input
