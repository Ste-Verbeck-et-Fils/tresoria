import Loader from '../../../components/ui/Loader'
import React, { useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import api from '../../../services/api'
import '../../../styles/public/dashboard.css'

const NotificationsDashboard = () => {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications')
      setNotifications(res.data?.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className='dashboard-page'>
      <header className='dashboard-header'>
        <h1>Notifications</h1>
        <p>Retrouvez ici toutes vos alertes et communications importantes.</p>
      </header>

      <div className='notifications-list' style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isLoading
          ? (
            <Loader message='Chargement des notifications...' />
            )
          : notifications.length === 0
            ? (
              <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>Vous n'avez aucune notification pour le moment.</p>
              </div>
              )
            : (
                notifications.map(notif => (
                  <div key={notif.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', background: notif.read ? '#fff' : '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    <div style={{ background: notif.read ? '#f1f5f9' : '#bfdbfe', color: notif.read ? '#94a3b8' : '#2563eb', padding: '12px', borderRadius: '50%' }}>
                      <Bell size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: notif.read ? 400 : 600 }}>{notif.message}</p>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(notif.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                    {!notif.read && (
                      <button onClick={() => markAsRead(notif.id)} style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                        <Check size={16} /> Marquer lu
                      </button>
                    )}
                  </div>
                ))
              )}
      </div>
    </div>
  )
}

export default NotificationsDashboard
