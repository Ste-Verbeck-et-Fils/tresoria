import React from 'react'
import { ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react'
import './Sidebar.css'

const Sidebar = ({
  links = [],
  isExpanded = true,
  onToggle,
  onNavigate,
  className = '',
  ...props
}) => {
  return (
    <aside className={`tresoria-sidebar ${isExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'} ${className}`} {...props}>
      <div className='sidebar-header'>
        <h2 className='handwritten-title' id='sidebar-title'>
          Gs {isExpanded && <span className='handwritten-highlight'>emmanuel</span>}
        </h2>
        <button className='sidebar-toggle-btn' onClick={onToggle} aria-label='Toggle Sidebar'>
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        <button className='sidebar-mobile-close' onClick={onToggle} aria-label='Fermer le menu'>
          <X size={20} />
        </button>
      </div>

      <nav className='sidebar-nav'>
        {links.map((link, idx) => (
          <a
            key={idx}
            href={link.href}
            className={`sidebar-link ${link.active ? 'sidebar-link--active' : ''} ${link.disabled ? 'sidebar-link--disabled' : ''}`}
            title={!isExpanded ? link.label : ''}
            aria-disabled={link.disabled ? 'true' : undefined}
            onClick={(event) => {
              if (link.disabled) {
                event.preventDefault()
                return
              }

              onNavigate?.()
            }}
          >
            {link.icon && <span className='sidebar-icon'>{link.icon}</span>}
            {isExpanded && <span className='sidebar-label'>{link.label}</span>}
          </a>
        ))}
      </nav>

      <div className='sidebar-footer'>
        <button className='sidebar-logout-btn' title={!isExpanded ? 'Déconnexion' : ''}>
          <span className='logout-icon'><LogOut size={18} /></span>
          {isExpanded && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
