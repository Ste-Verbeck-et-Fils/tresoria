import React from 'react'
import { Menu, Bell, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import './AdminHeader.css'

const AdminHeader = ({ profile, isSidebarOpen = false, onToggleSidebar }) => {
  const fullName = profile?.full_name || 'Utilisateur'
  const role = profile?.role || ''
  const avatarUrl = profile?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff`

  return (
    <header className='admin-header'>
      <button
        type='button'
        className='admin-mobile-menu-button'
        aria-label='Ouvrir le menu'
        aria-expanded={isSidebarOpen}
        onClick={onToggleSidebar}
      >
        <Menu size={22} />
      </button>

      <div className='admin-header-right' style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to='/dashboard/aide' style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
          <MessageCircle size={22} />
        </Link>
        <Link to='/dashboard/notifications' style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
          <Bell size={22} />
        </Link>
        <Link to='/dashboard/profile' style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className='admin-profile'>
            <div className='admin-user-info'>
              <span className='admin-name'>{fullName}</span>
              <span className='admin-role'>{role}</span>
            </div>
            <div className='admin-avatar-container'>
              <img src={avatarUrl} alt={fullName} className='admin-avatar' />
              <span className='admin-status-dot' />
            </div>
          </div>
        </Link>
      </div>
    </header>
  )
}

export default AdminHeader
