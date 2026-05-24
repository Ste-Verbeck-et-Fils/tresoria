import React from 'react'
import { X } from 'lucide-react'
import './Sidebar.css'

const Sidebar = ({
  links = [],
  isOpen = true,
  onClose,
  className = '',
  ...props
}) => {
  return (
    <>
      {isOpen && onClose && (
        <div className='sidebar-overlay' onClick={onClose} />
      )}

      <aside className={`tresoria-sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'} ${className}`} {...props}>
        <div className='sidebar-header'>
          <h2 className='handwritten-title'>
            Gs <span className='handwritten-highlight'>emmanuel</span>
          </h2>
          {onClose && (
            <button className='sidebar-close-btn' onClick={onClose} aria-label='Close Sidebar'>
              <X size={20} />
            </button>
          )}
        </div>

        <nav className='sidebar-nav'>
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              className={`sidebar-link ${link.active ? 'sidebar-link--active' : ''}`}
            >
              {link.icon && <span className='sidebar-icon'>{link.icon}</span>}
              <span className='sidebar-label'>{link.label}</span>
            </a>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
