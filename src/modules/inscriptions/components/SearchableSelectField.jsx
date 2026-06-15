import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'

const normalizeValue = (value) => String(value ?? '')

const SearchableSelectField = ({
  id,
  label,
  value,
  options = [],
  placeholder = 'Rechercher',
  emptyMessage = 'Aucun resultat.',
  createLabel,
  disabled = false,
  error,
  onChange,
  onCreate,
}) => {
  const [search, setSearch] = useState('')
  const [hasTyped, setHasTyped] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setSearch('')
    setHasTyped(false)
  }, [value])

  const selectedOption = options.find((option) => normalizeValue(option.value) === normalizeValue(value))
  const normalizedSearch = search.trim().toLowerCase()
  const inputValue = hasTyped ? search : selectedOption?.label || ''
  const filteredOptions = useMemo(() => {
    const matchingOptions = normalizedSearch
      ? options.filter((option) => (
        `${option.label} ${option.searchText || ''}`.toLowerCase().includes(normalizedSearch)
      ))
      : options

    return matchingOptions.slice(0, 8)
  }, [normalizedSearch, options])
  const canCreate = Boolean(onCreate && createLabel && normalizedSearch && filteredOptions.length === 0)

  const selectOption = (option) => {
    if (option.disabled) {
      return
    }

    setSearch('')
    setHasTyped(false)
    setIsOpen(false)
    onChange({ target: { id, value: normalizeValue(option.value) } })
  }

  const clearSelection = () => {
    setSearch('')
    setHasTyped(false)
    setIsOpen(true)
    onChange({ target: { id, value: '' } })
  }

  return (
    <div
      className='inscription-searchable-field'
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false)
        }
      }}
    >
      <label htmlFor={`${id}-search`}>{label}</label>
      <div className={`inscription-searchable-field__control ${error ? 'inscription-searchable-field__control--error' : ''}`}>
        <Search size={17} aria-hidden='true' />
        <input
          id={`${id}-search`}
          type='search'
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete='off'
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value)
            setHasTyped(true)
            setIsOpen(true)

            if (value) {
              onChange({ target: { id, value: '' } })
            }
          }}
        />
        {(value || inputValue) && !disabled && (
          <button
            type='button'
            aria-label={`Effacer ${label}`}
            onClick={clearSelection}
            className='inscription-searchable-field__clear'
          >
            <X size={15} aria-hidden='true' />
          </button>
        )}
      </div>

      {error && <span className='inscription-field-error'>{error}</span>}

      {isOpen && !disabled && (
        <div className='inscription-searchable-field__menu'>
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              type='button'
              disabled={option.disabled}
              onClick={() => selectOption(option)}
              title={option.disabledReason || undefined}
              className={`inscription-searchable-field__option ${normalizeValue(option.value) === normalizeValue(value) ? 'inscription-searchable-field__option--selected' : ''} ${option.disabled ? 'inscription-searchable-field__option--disabled' : ''}`}
            >
              <span>{option.label}</span>
              {option.disabledReason && <small>{option.disabledReason}</small>}
            </button>
          ))}

          {filteredOptions.length === 0 && (
            <p className='inscription-searchable-field__empty'>{emptyMessage}</p>
          )}

          {canCreate && (
            <button
              type='button'
              onClick={() => onCreate(search.trim())}
              className='inscription-searchable-field__create'
            >
              <Plus size={15} aria-hidden='true' />
              {createLabel}
            </button>
          )}

          {!normalizedSearch && options.length > filteredOptions.length && (
            <p className='inscription-searchable-field__hint'>Saisissez quelques lettres pour affiner la recherche.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchableSelectField
