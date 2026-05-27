import React, { useEffect, useState } from 'react'
import './AdminHeader.css'
import { getUserProfile } from '../../services/profileService'

const AdminHeader = () => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 1. Récupérer depuis localStorage pour un affichage instantané
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {}
    }

    // 2. Récupérer les données fraîches depuis le backend
    const fetchUser = async () => {
      try {
        const freshUser = await getUserProfile()
        setUser(freshUser)
        // Mettre à jour le localStorage
        localStorage.setItem('user', JSON.stringify(freshUser))
      } catch (error) {
        console.error('Impossible de charger les données utilisateur', error)
      }
    }
    
    fetchUser()
  }, [])

  const fullName = user?.full_name || 'Chargement...'
  const role = user?.role || '...'
  
  // Utilise photo_url de Cloudinary ou génère un avatar par défaut via ui-avatars
  const avatarUrl = user?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=random&color=fff`

  return (
    <header className='admin-header'>
      <div className='admin-header-right'>
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
