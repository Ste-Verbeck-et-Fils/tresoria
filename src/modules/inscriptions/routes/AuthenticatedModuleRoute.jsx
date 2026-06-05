import React from 'react'
import { Navigate, Outlet, useOutletContext } from 'react-router-dom'
import ModuleState from '../components/ModuleState'
import Loader from '../../../components/ui/Loader'

const AuthenticatedModuleRoute = () => {
  const context = useOutletContext()

  if (context.isProfileLoading) {
    return <Loader message='Verification de votre session...' />
  }

  if (context.profileLoadError) {
    return (
      <ModuleState
        type='error'
        title='Session indisponible'
        message={context.profileLoadError}
        actionLabel='Recharger'
        onAction={() => window.location.reload()}
      />
    )
  }

  if (!context.sharedProfile) {
    return <Navigate to='/login' replace />
  }

  return <Outlet context={context} />
}

export default AuthenticatedModuleRoute
