import React from 'react'
import './AdminHeader.css'
import photoVerbeck from '../../assets/images/photo_verbeck.jpeg'

const AdminHeader = () => {
  return (
    <header className='admin-header'>
      <div className='admin-header-right'>
        <div className='admin-profile'>
          <div className='admin-user-info'>
            <span className='admin-name'>JEAN-MARC VERBECK</span>
            <span className='admin-role'>SUPER ADMIN</span>
          </div>
          <div className='admin-avatar-container'>
            <img src={photoVerbeck} alt='JEAN-MARC VERBECK' className='admin-avatar' />
            <span className='admin-status-dot' />
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
