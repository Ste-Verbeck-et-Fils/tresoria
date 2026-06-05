import React from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'
import AccessDenied from '../components/AccessDenied'
import { normalizeRole } from '../../../utils/roles'

const RoleProtectedRoute = ({ allowedRoles }) => {
  const context = useOutletContext()
  const role = normalizeRole(context.sharedProfile?.role)

  if (!allowedRoles.includes(role)) {
    return <AccessDenied />
  }

  return <Outlet context={context} />
}

export default RoleProtectedRoute
