import React from 'react'
import { Navigate, Outlet, useOutletContext } from 'react-router-dom'
import ModuleState from '../components/ModuleState'

const AuthenticatedModuleRoute = () => {
  const context = useOutletContext()

  if (context.isProfileLoading) {
    return <div className='inscription-loading'>Verification de votre session...</div>
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
