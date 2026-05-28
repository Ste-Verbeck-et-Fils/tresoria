import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import AdminHeader from '../../components/layout/AdminHeader'
import { SwatchBook, Users, CreditCard, FileText, UserRound, HelpCircle } from 'lucide-react'
import { getUserProfile, normalizeProfile } from '../../services/profileService'

import '../../styles/public/layout.css'

// Ce composant structure le dashboard et affiche les pages internes dans la zone de contenu.
const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(window.innerWidth > 768)

  const [sharedProfile, setSharedProfile] = useState(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [profileLoadError, setProfileLoadError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const hasToken =
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('access_token')

      if (!hasToken) {
        navigate('/login', { replace: true })
        return
      }

      setIsProfileLoading(true)
      setProfileLoadError('')

      try {
        const data = await getUserProfile()
        setSharedProfile(normalizeProfile(data))
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          navigate('/login', { replace: true })
          return
        }
        setProfileLoadError(error.message || 'Impossible de charger le profil.')
      } finally {
        setIsProfileLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarExpanded(window.innerWidth > 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded)
  }

  const closeMobileSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarExpanded(false)
    }
  }

  const links = [
    { label: 'Tableau de bord', href: '#', icon: <SwatchBook size={20} />, disabled: true },
    { label: 'Paiements', href: '#', icon: <CreditCard size={20} />, disabled: true },
    { label: 'Élèves', href: '#', icon: <Users size={20} />, disabled: true },
    { label: 'Rapports', href: '#', icon: <FileText size={20} />, disabled: true },
    {
      label: 'Profil',
      href: '/dashboard/profile',
      icon: <UserRound size={20} />,
      active: location.pathname === '/dashboard/profile',
    },
    { label: 'Aide', href: '#', icon: <HelpCircle size={20} />, disabled: true },
  ]

  return (
    <div className='dashboard-layout'>
      <Sidebar
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        onNavigate={closeMobileSidebar}
        links={links}
      />
      <div className='dashboard-main'>
        <AdminHeader
          profile={sharedProfile}
          isSidebarOpen={isSidebarExpanded}
          onToggleSidebar={toggleSidebar}
        />
        <div className='dashboard-content'>
          <Outlet context={{ sharedProfile, setSharedProfile, isProfileLoading, profileLoadError }} />
        </div>
      </div>
      <button
        type='button'
        className={`dashboard-mobile-overlay ${isSidebarExpanded ? 'dashboard-mobile-overlay--visible' : ''}`}
        aria-label='Fermer le menu'
        onClick={closeMobileSidebar}
      />
    </div>
  )
}

export default Layout
