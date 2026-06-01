import React from 'react'

const SelectField = ({
  id,
  label,
  value,
  options = [],
  placeholder = 'Selectionner une option',
  error,
  disabled = false,
  onChange,
  className = '',
}) => {
  return (
    <div className={`inscription-select-field ${className}`}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className={error ? 'inscription-select inscription-select--error' : 'inscription-select'}
      >
        <option value=''>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className='inscription-field-error'>{error}</span>}
    </div>
  )
}

export default SelectField
