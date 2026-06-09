import React from 'react'
import { X } from 'lucide-react'
import Button from './Button'
import './FilterPanel.css'

const FilterPanel = ({
  isOpen,
  onClose,
  onApply,
  onClear,
  children
}) => {
  return (
    <>
      {isOpen && <div className='filter-panel-overlay' onClick={onClose} />}
      <div className={`filter-panel ${isOpen ? 'filter-panel--open' : ''}`}>
        <div className='filter-panel-header'>
          <h3>Filtres</h3>
          <button className='filter-panel-close' onClick={onClose} aria-label='Fermer les filtres'>
            <X size={20} />
          </button>
        </div>
        <div className='filter-panel-content'>
          {children}
        </div>
        <div className='filter-panel-footer'>
          <Button variant='outline' label='Effacer' onClick={onClear} />
          <Button variant='secondary' label='Appliquer' onClick={onApply} />
        </div>
      </div>
    </>
  )
}

export default FilterPanel
