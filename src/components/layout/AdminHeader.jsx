import React, { useEffect, useState } from 'react'
import { Menu, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import './AdminHeader.css'
import { getUserProfile } from '../../services/profileService'

const getStoredUser = () => {
  const storedUser = localStorage.getItem('user')

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    return null
  }
}

const AdminHeader = ({ profile, isSidebarOpen = false, onToggleSidebar }) => {
  const [user, setUser] = useState(() => getStoredUser())

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const freshUser = await getUserProfile()
        setUser(freshUser)
        localStorage.setItem('user', JSON.stringify(freshUser))
      } catch (error) {
        console.error('Impossible de charger les donnees utilisateur', error)
      }
    }

    fetchUser()
  }, [])

  const displayedUser = profile || user
  const fullName = displayedUser?.full_name || 'Chargement...'
  const role = displayedUser?.role || '...'
  const avatarUrl = displayedUser?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayedUser?.full_name || 'User')}&background=random&color=fff`

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
        <Link to='/dashboard/notifications' style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
          <Bell size={22} />
        </Link>
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
      </div>
    </header>
  )
}

export default AdminHeader
