import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import AdminHeader from '../../components/layout/AdminHeader'
import {
  BookOpenCheck,
  CalendarDays,
  CreditCard,
  FileText,
  GraduationCap,
  HelpCircle,
  KeyRound,
  MapPin,
  School,
  SwatchBook,
  UserRound,
  UsersRound,
  ArrowRightLeft,
  MessageSquare,
  Wallet,
  Settings,
  NotebookPen
} from 'lucide-react'
import { logoutUser } from '../../services/authService'
import { getUserProfile, normalizeProfile } from '../../services/profileService'
import { ADMIN_ROLES, EXPENSE_ROLES, PAYMENT_ROLES, TREASURY_ROLES, normalizeRole } from '../../utils/roles'
import Loader from '../../components/ui/Loader'

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const isPathActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
  const normalizedRole = normalizeRole(sharedProfile?.role)
  const isAdmin = ADMIN_ROLES.includes(normalizedRole)
  const isComptable = normalizedRole === 'COMPTABLE'
  const isParent = normalizedRole === 'PARENT'

  const canAccessInscriptions = isAdmin
  const canAccessClasses = isAdmin
  const canAccessAnneesScolaires = isAdmin
  const canAccessPaiements = isAdmin || isComptable
  const canAccessDepenses = isAdmin || isComptable
  const canAccessTresorerie = isAdmin || isComptable
  const canAccessParents = isAdmin

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error('Impossible de fermer la session cote serveur', error)
    } finally {
      localStorage.removeItem('authToken')
      localStorage.removeItem('token')
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('ai_chat_history')
      navigate('/login', { replace: true })
    }
  }

  const links = []

  if (canAccessTresorerie) {
    links.push({ label: 'Tableau de bord', href: '/tresorerie', icon: <SwatchBook size={20} />, active: location.pathname === '/tresorerie' || location.pathname === '/dashboard' })
  }

  const scolariteSubLinks = []

  if (canAccessInscriptions) {
    scolariteSubLinks.push({ label: 'Inscriptions', href: '/inscriptions', active: isPathActive('/inscriptions') })
  }

  if (isAdmin || isParent || isComptable) {
    scolariteSubLinks.push({ label: 'Elèves', href: '/students', active: isPathActive('/students') })
  }

  if (canAccessParents) {
    scolariteSubLinks.push({ label: 'Parents', href: '/parents', active: isPathActive('/parents') })
  }

  if (isAdmin || isParent) {
    scolariteSubLinks.push({ label: 'Adresses', href: '/adresses', active: isPathActive('/adresses') })
  }

  if (scolariteSubLinks.length > 0) {
    links.push({
      label: 'Scolarité',
      icon: <NotebookPen size={20} />,
      subLinks: scolariteSubLinks
    })
  }

  if (isParent) {
    links.push({ label: 'Payer', href: '/parent/payer', icon: <CreditCard size={20} />, active: isPathActive('/parent/payer') })
  }

  const comptabiliteSubLinks = []
  if (canAccessPaiements) comptabiliteSubLinks.push({ label: 'Entrées', href: '/paiements', active: isPathActive('/paiements') })
  if (canAccessDepenses) comptabiliteSubLinks.push({ label: 'Sorties', href: '/depenses', active: isPathActive('/depenses') })
  if (canAccessTresorerie) comptabiliteSubLinks.push({ label: 'Rapport financier', href: '/tresorerie/rapport-annee', active: isPathActive('/tresorerie/rapport-annee') })
  if (isAdmin || isComptable) comptabiliteSubLinks.push({ label: 'Rapport comptable', href: '/tresorerie/rapports-comptables', active: isPathActive('/tresorerie/rapports-comptables') })
  if (canAccessTresorerie) comptabiliteSubLinks.push({ label: 'Transfert interne', href: '/tresorerie/transferts', active: isPathActive('/tresorerie/transferts') })

  if (comptabiliteSubLinks.length > 0) {
    links.push({
      label: 'Comptabilité',
      icon: <Wallet size={20} />,
      subLinks: comptabiliteSubLinks
    })
  }

  const configSubLinks = []
  if (canAccessAnneesScolaires) configSubLinks.push({ label: 'Années scolaires', href: '/annees-scolaires', active: isPathActive('/annees-scolaires') })
  if (canAccessClasses) configSubLinks.push({ label: 'Classes', href: '/classes', active: isPathActive('/classes') })

  if (configSubLinks.length > 0) {
    links.push({
      label: 'Configuration',
      icon: <Settings size={20} />,
      subLinks: configSubLinks
    })
  }
  if (isAdmin || isComptable) {
    links.push({ label: 'Envoie SMS', href: '/sms', icon: <MessageSquare size={20} />, active: isPathActive('/sms') })
  }
  if (isAdmin) {
    links.push({ label: 'Utilisateurs', href: '/users', icon: <UsersRound size={20} />, active: isPathActive('/users') })
  }

  links.push(
    { label: 'Profil', href: '/dashboard/profile', icon: <UserRound size={20} />, active: location.pathname === '/dashboard/profile' },
    { label: 'Dispositifs', href: '/dashboard/devices', icon: <KeyRound size={20} />, active: location.pathname === '/dashboard/devices' },
    { label: 'Aide', href: '/dashboard/aide', icon: <HelpCircle size={20} />, active: isPathActive('/dashboard/aide') }
  )

  if (isProfileLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <Loader message='Chargement de votre espace...' />
      </div>
    )
  }

  return (
    <div className='dashboard-layout'>
      <Sidebar
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        onNavigate={closeMobileSidebar}
        onLogout={handleLogout}
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
