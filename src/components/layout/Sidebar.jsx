import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import './Sidebar.css'

// Ce composant affiche la navigation du dashboard et la deconnexion de session.
const Sidebar = ({
  links = [],
  isExpanded = true,
  onToggle,
  className = '',
  ...props
}) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <aside className={`tresoria-sidebar ${isExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'} ${className}`} {...props}>
      <div className='sidebar-header'>
        <h2 className='handwritten-title' id='sidebar-title'>
          Gs {isExpanded && <span className='handwritten-highlight'>emmanuel</span>}
        </h2>
        <button className='sidebar-toggle-btn' onClick={onToggle} aria-label='Toggle Sidebar'>
          {isExpanded
            ? <ChevronLeft size={20} />
            : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className='sidebar-nav'>
        {links.map((link, idx) => (
          link.disabled ? (
            <button
              key={idx}
              type='button'
              className='sidebar-link sidebar-link--disabled'
              title={!isExpanded ? link.label : ''}
              aria-disabled='true'
            >
              {link.icon && <span className='sidebar-icon'>{link.icon}</span>}
              {isExpanded && <span className='sidebar-label'>{link.label}</span>}
            </button>
          ) : (
            <NavLink
              key={idx}
              to={link.href}
              className={({ isActive }) => `sidebar-link ${isActive || link.active ? 'sidebar-link--active' : ''}`}
              title={!isExpanded ? link.label : ''}
            >
              {link.icon && <span className='sidebar-icon'>{link.icon}</span>}
              {isExpanded && <span className='sidebar-label'>{link.label}</span>}
            </NavLink>
          )
        ))}
      </nav>

      <div className='sidebar-footer'>
        <button type='button' className='sidebar-logout-btn' title={!isExpanded ? 'Deconnexion' : ''} onClick={handleLogout}>
          <span className='logout-icon'><LogOut size={18} /></span>
          {isExpanded && <span>Deconnexion</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
