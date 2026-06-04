import React from 'react'
import { ShieldAlert } from 'lucide-react'

const AccessDenied = () => {
  return (
    <section className='inscription-access-denied' aria-labelledby='access-denied-title'>
      <ShieldAlert size={34} aria-hidden='true' />
      <div>
        <h1 id='access-denied-title'>Acces refuse</h1>
        <p>Votre role ne permet pas de consulter ce contenu.</p>
      </div>
    </section>
  )
}

export default AccessDenied
