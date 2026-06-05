import React from 'react'
import './Loader.css'

const Loader = ({ message = 'Chargement en cours...' }) => {
  return (
    <div className='loader-container' role='status'>
      <div className='loader-spinner' />
      {message && <p className='loader-message'>{message}</p>}
    </div>
  )
}

export default Loader
