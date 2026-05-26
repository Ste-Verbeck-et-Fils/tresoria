import React from 'react'
import { UserCircle2 } from 'lucide-react'
import './AdminHeader.css'

const AdminHeader = ({ profile }) => {
  return (
    <header className='admin-header'>
      <div className='admin-header-right'>
        <div className='admin-profile'>
          <div className='admin-user-info'>
            <span className='admin-name'>{profile?.full_name || ''}</span>
            <span className='admin-role'>{profile?.role || ''}</span>
          </div>
          <div className='admin-avatar-container'>
            {profile?.photo_url
              ? <img src={profile.photo_url} alt={profile.full_name || 'Photo de profil'} className='admin-avatar' />
              : <UserCircle2 className='admin-avatar admin-avatar--fallback' />}
            <span className='admin-status-dot' />
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
