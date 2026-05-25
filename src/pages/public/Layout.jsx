import React, { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import AdminHeader from '../../components/layout/AdminHeader'
import { SwatchBook, Users, CreditCard, FileText, UserRound, HelpCircle } from 'lucide-react'

import '../../styles/public/layout.css'

const Layout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(window.innerWidth > 768)

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

  const links = [
    { label: 'Tableau de bord', href: '#', icon: <SwatchBook size={20} /> },
    { label: 'Paiements', href: '#', icon: <CreditCard size={20} /> },
    { label: 'Élèves', href: '#', icon: <Users size={20} /> },
    { label: 'Rapports', href: '#', icon: <FileText size={20} /> },
    { label: 'Profile', href: '#', icon: <UserRound size={20} /> },
    { label: 'Aide', href: '#', icon: <HelpCircle size={20} /> },
  ]

  return (
    <div className='dashboard-layout'>
      <Sidebar
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        links={links}
      />
      <div className='dashboard-main'>
        <AdminHeader />
        <div className='dashboard-content'>
          {/* Main content will go here */}
        </div>
      </div>
    </div>
  )
}

export default Layout
