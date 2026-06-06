import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import EntityListPage from '../../inscriptions/components/EntityListPage'
import { getStudents } from '../../../services/studentService'
import { formatDate, getStudentName } from '../../inscriptions/utils/data'
import { normalizeRole } from '../../../utils/roles'

const columns = [
  { label: 'Reference', render: (item) => `#${item.id}` },
  { label: 'Nom complet', render: (item) => getStudentName(item) },
  { label: 'Sexe', render: (item) => item.sexe || '-' },
  { label: 'Date de naissance', render: (item) => formatDate(item.date_naissance) },
  { label: 'Contact', render: (item) => item.contact || '-' },
]

const StudentsPage = () => {
  const location = useLocation()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : {}
  const normalizedUserRole = normalizeRole(user?.role)
  const isParent = normalizedUserRole === 'PARENT'
  const isComptable = normalizedUserRole === 'COMPTABLE'
  const canCreate = !isParent && !isComptable

  return (
    <EntityListPage
      title='Eleves'
      loadItems={getStudents}
      columns={columns}
      emptyMessage='Aucun eleve enregistre.'
      createPath={canCreate ? '/students/create' : null}
      createLabel={canCreate ? 'Nouvel eleve' : null}
      getRowPath={(item) => `/students/${item.id}`}
      searchPlaceholder='Rechercher un eleve'
      getSearchText={(item) => [
        item.id,
        item.nom,
        item.postnom,
        item.prenom,
        item.sexe,
        item.contact,
      ].join(' ')}
      extraActions={(item) => (
        <Link to={`/students/${item.id}/paiements`} style={{ padding: '10px 16px', textDecoration: 'none', color: '#173f5f', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #f3f4f6' }}>
          <CreditCard size={16} /> Paiements
        </Link>
      )}
      successMessage={location.state?.successMessage}
    />
  )
}

export default StudentsPage
