import React, { useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Trash2, MoreVertical, PencilLine } from 'lucide-react'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import Button from '../../../components/ui/Button'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import PasswordConfirmModal from '../../../components/ui/PasswordConfirmModal'
import FilterPanel from '../../../components/ui/FilterPanel'
import { getUsers, deleteUser } from '../../../services/userService'
import { formatDate, normalizeCollection } from '../../inscriptions/utils/data'

const UserRowActions = ({ item, user, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const ref = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const canAction = user.role === 'SUPER_ADMIN' || (user.role === 'ADMIN' && !['ADMIN', 'SUPER_ADMIN'].includes(item.role))
  if (!canAction || user.id === item.id) return null

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
        <MoreVertical size={20} color='#6b7280' />
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: '100%',
          top: '0',
          background: 'white',
          border: '1px solid #e4e8ef',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 50,
          minWidth: '150px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        >
          <button
            onClick={() => { setIsOpen(false); navigate(`/users/${item.id}`) }}
            style={{ padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#173f5f', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <PencilLine size={16} /> Modifier
          </button>
          <button
            onClick={() => { setIsOpen(false); onDelete(item.id) }}
            style={{ padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#ef4444', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Trash2 size={16} /> Supprimer
          </button>
        </div>
      )}
    </div>
  )
}

const UsersPage = () => {
  const location = useLocation()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : {}

  const [isDeleting, setIsDeleting] = useState(false)

  const [targetUserId, setTargetUserId] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const [filters, setFilters] = useState({
    status: [],
    role: []
  })

  const loadItems = useCallback(async () => {
    const response = await getUsers()
    return normalizeCollection(response)
  }, [])

  const handleDeleteClick = (id) => {
    setTargetUserId(id)
    setShowPasswordModal(true)
  }

  const handlePasswordConfirm = async () => {
    setShowPasswordModal(false)
    setIsDeleting(true)
    try {
      await deleteUser(targetUserId)
      window.location.reload()
    } catch (error) {
      alert(error.message || 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
    setTargetUserId(null)
  }

  const columns = [
    {
      label: 'Photo',
      render: (item) => <img src={item.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.full_name)} alt='Photo' style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
    },
    { label: 'Nom complet', render: (item) => item.full_name },
    { label: 'Téléphone', render: (item) => item.phone },
    { label: 'Rôle', render: (item) => <StatusBadge value={item.role} /> },
    { label: 'Statut', render: (item) => <StatusBadge value={item.statut} /> },
    { label: 'Création', render: (item) => formatDate(item.created_at) }
  ]

  const getSearchText = (item) => {
    return [
      item.full_name,
      item.phone,
      item.role,
      item.statut
    ].filter(Boolean).join(' ').toLowerCase()
  }

  const handleArrayToggle = (key, value) => {
    setFilters(prev => {
      const arr = prev[key]
      const isSelected = arr.includes(value)
      return {
        ...prev,
        [key]: isSelected ? arr.filter(v => v !== value) : [...arr, value]
      }
    })
  }

  const localFilter = (item) => {
    if (filters.status.length > 0 && !filters.status.includes(item.statut)) return false
    if (filters.role.length > 0 && !filters.role.includes(item.role)) return false
    return true
  }

  const hasActiveFilters = filters.status.length > 0 || filters.role.length > 0

  const handleClearFilters = () => {
    setFilters({ status: [], role: [] })
  }

  return (
    <>
      <EntityListPage
        title='Comptes Utilisateurs'
        description='Gérez les accès au système et les mots de passe.'
        loadItems={loadItems}
        columns={columns}
        emptyMessage='Aucun utilisateur trouvé.'
        createPath='/users/create'
        createLabel='Créer un compte'
        searchPlaceholder='Recherche par nom, téléphone, rôle...'
        getSearchText={getSearchText}
        successMessage={location.state?.successMessage}
        rowActions={(item) => <UserRowActions item={item} user={user} onDelete={handleDeleteClick} />}
        localFilter={localFilter}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        renderFilterPanel={({ isOpen, onClose }) => (
          <FilterPanel
            isOpen={isOpen}
            onClose={onClose}
            onApply={onClose}
            onClear={handleClearFilters}
          >
            <div className='filter-field'>
              <label>Statut</label>
              <select
                className='inscription-select'
                value={filters.status[0] || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setFilters((prev) => ({ ...prev, status: val ? [val] : [] }))
                }}
              >
                <option value=''>Tous les statuts</option>
                <option value='ACTIF'>ACTIF</option>
                <option value='INACTIF'>INACTIF</option>
                <option value='BLOQUE'>BLOQUE</option>
              </select>
            </div>

            <div className='filter-field'>
              <label>Rôle</label>
              <select
                className='inscription-select'
                value={filters.role[0] || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setFilters((prev) => ({ ...prev, role: val ? [val] : [] }))
                }}
              >
                <option value=''>Tous les rôles</option>
                <option value='PARENT'>PARENT</option>
                <option value='COMPTABLE'>COMPTABLE</option>
                <option value='ADMIN'>ADMIN</option>
                <option value='SUPER_ADMIN'>SUPER ADMIN</option>
              </select>
            </div>
          </FilterPanel>
        )}
      />

      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false) }}
        onConfirm={handlePasswordConfirm}
        title='Confirmation requise'
        message='Veuillez saisir votre mot de passe pour confirmer la suppression du compte.'
        actionLabel='Supprimer'
      />
    </>
  )
}

export default UsersPage
