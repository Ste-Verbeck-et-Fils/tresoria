import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LogOut, X, ChevronDown, ChevronUp } from 'lucide-react'
import './Sidebar.css'

const Sidebar = ({
  links = [],
  isExpanded = true,
  onToggle,
  onNavigate,
  onLogout,
  className = '',
  ...props
}) => {
  const [openDropdowns, setOpenDropdowns] = useState({})

  const toggleDropdown = (label) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [label]: !prev[label]
    }))
  }
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
        {links.map((link, idx) => {
          if (link.subLinks) {
            const isOpen = openDropdowns[link.label]
            const isActive = link.subLinks.some(sub => sub.active) || link.active

            return (
              <div key={idx} className="sidebar-dropdown-group">
                <button
                  className={`sidebar-link sidebar-dropdown-btn ${isActive ? 'sidebar-link--active' : ''}`}
                  title={!isExpanded ? link.label : ''}
                  onClick={() => {
                    if (!isExpanded) {
                      onToggle?.()
                      if (!isOpen) {
                        setOpenDropdowns(prev => ({ ...prev, [link.label]: true }))
                      }
                    } else {
                      toggleDropdown(link.label)
                    }
                  }}
                >
                  {link.icon && <span className='sidebar-icon'>{link.icon}</span>}
                  {isExpanded && <span className='sidebar-label'>{link.label}</span>}
                  {isExpanded && (
                    <span className='sidebar-dropdown-icon'>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  )}
                </button>
                {isExpanded && isOpen && (
                  <div className="sidebar-sublinks">
                    {link.subLinks.map((sub, subIdx) => (
                      <Link
                        key={subIdx}
                        to={sub.href}
                        className={`sidebar-link sidebar-sublink ${sub.active ? 'sidebar-link--active' : ''} ${sub.disabled ? 'sidebar-link--disabled' : ''}`}
                        title={!isExpanded ? sub.label : ''}
                        onClick={(event) => {
                          if (sub.disabled) {
                            event.preventDefault()
                            return
                          }
                          onNavigate?.()
                        }}
                      >
                        <span className='sidebar-label'>{sub.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={idx}
              to={link.href}
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
            </Link>
          )
        })}
      </nav>

      <div className='sidebar-footer'>
        <button className='sidebar-logout-btn' title={!isExpanded ? 'Deconnexion' : ''} onClick={onLogout}>
          <span className='logout-icon'><LogOut size={18} /></span>
          {isExpanded && <span>Deconnexion</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
