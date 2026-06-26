import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Search, AlertTriangle } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { getPaiements } from '../../../services/paiementService'

const pageStyle = {
  minHeight: '80vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  fontFamily: 'Inter, system-ui, sans-serif'
}

const cardStyle = {
  background: '#ffffff',
  borderRadius: '24px',
  padding: '3rem 2rem',
  width: '100%',
  maxWidth: '460px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 15px rgba(0,0,0,0.02)',
  textAlign: 'center',
  border: '1px solid rgba(229, 231, 235, 0.8)',
  position: 'relative',
  overflow: 'hidden'
}

const iconContainerStyle = (bgColor) => ({
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  background: bgColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 2rem',
  boxShadow: `0 0 0 10px ${bgColor}40`
})

const titleStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: '#111827',
  marginBottom: '1rem',
  lineHeight: '1.2'
}

const textStyle = {
  color: '#4B5563',
  fontSize: '1.05rem',
  lineHeight: '1.6',
  marginBottom: '2rem'
}

const referenceBoxStyle = {
  background: '#F3F4F6',
  padding: '0.75rem',
  borderRadius: '12px',
  fontSize: '0.9rem',
  fontFamily: 'monospace',
  color: '#374151',
  marginBottom: '2.5rem',
  display: 'inline-block'
}

const PaiementStatusPage = () => {
  const [searchParams] = useSearchParams()
  const rawReference = searchParams.get('ref')
  const urlStatus = searchParams.get('status')
  const source = searchParams.get('source') || '/dashboard'

  // Nettoyage de la référence au cas où MaishaPay rajoute /?status=400 ou ?status=... à la fin de notre URL
  let cleanRef = rawReference
  if (cleanRef) {
    if (cleanRef.includes('/?')) {
      cleanRef = cleanRef.split('/?')[0]
    } else if (cleanRef.includes('?')) {
      cleanRef = cleanRef.split('?')[0]
    }
  }
  const reference = cleanRef

  const navigate = useNavigate()

  const [status, setStatus] = useState('loading') // 'loading', 'success', 'pending', 'error', 'cancelled'
  const [paiement, setPaiement] = useState(null)

  const checkStatus = useCallback(async () => {
    if (!reference) {
      setStatus('error')
      return
    }

    if (urlStatus === 'cancelled') {
      setStatus('cancelled')
      return
    }

    try {
      const response = await getPaiements({ reference })
      const paiements = response?.data?.paiements || response?.paiements || response?.data || []
      const foundPaiement = paiements.find(p => p.reference === reference)

      if (!foundPaiement) {
        setStatus('error')
        return
      }

      setPaiement(foundPaiement)

      if (foundPaiement.statut === 'CONFIRME') {
        setStatus('success')
      } else if (foundPaiement.statut === 'ANNULE') {
        setStatus('cancelled')
      } else {
        setStatus('pending')
      }
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }, [reference, urlStatus])

  useEffect(() => {
    checkStatus()

    let interval = null
    if (status === 'pending') {
      interval = setInterval(() => {
        checkStatus()
      }, 10000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [checkStatus, status])

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <div style={iconContainerStyle('#F3F4F6')}>
              <Search size={48} color='#6B7280' className='animate-pulse' />
            </div>
            <h1 style={titleStyle}>Recherche de votre paiement...</h1>
            <p style={textStyle}>
              Nous interrogeons les serveurs MaishaPay pour récupérer l'état exact de votre transaction.
            </p>
          </>
        )
      case 'success':
        return (
          <>
            <div style={iconContainerStyle('#D1FAE5')}>
              <CheckCircle size={52} color='#059669' />
            </div>
            <h1 style={titleStyle}>Paiement Confirmé !</h1>
            <p style={textStyle}>
              Félicitations, votre paiement de <strong>{paiement?.montant} $</strong> a été validé avec succès par MaishaPay.
            </p>
            <div style={referenceBoxStyle}>Réf : {reference}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button variant='super' label='Continuer' onClick={() => navigate(source)} style={{ width: '100%' }} />
            </div>
          </>
        )
      case 'cancelled':
        return (
          <>
            <div style={iconContainerStyle('#FEE2E2')}>
              <XCircle size={52} color='#DC2626' />
            </div>
            <h1 style={titleStyle}>Paiement Annulé</h1>
            <p style={textStyle}>
              L'opération a été annulée ou rejetée (Fonds insuffisants, erreur réseau, ou annulation manuelle).
            </p>
            <div style={referenceBoxStyle}>Réf : {reference}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button variant='super' label='Tenter un nouveau paiement' onClick={() => navigate(source)} style={{ width: '100%' }} />
              <Button variant='ghost' label='Retour au tableau de bord' onClick={() => navigate('/dashboard')} style={{ width: '100%' }} />
            </div>
          </>
        )
      case 'pending':
        return (
          <>
            <div style={iconContainerStyle('#FEF3C7')}>
              <Clock size={52} color='#D97706' />
            </div>
            <h1 style={titleStyle}>En attente de confirmation</h1>
            <p style={textStyle}>
              Votre demande a bien été envoyée à MaishaPay.<br />
              Nous attendons leur signal pour finaliser l'opération (jusqu'à 90 secondes).
            </p>
            <div style={referenceBoxStyle}>Réf : {reference}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button variant='ghost' label='Actualiser maintenant' onClick={checkStatus} style={{ width: '100%' }} />
              <Button variant='super' label='Retour' onClick={() => navigate(source)} style={{ width: '100%' }} />
            </div>
          </>
        )
      case 'error':
      default:
        return (
          <>
            <div style={iconContainerStyle('#F3F4F6')}>
              <AlertTriangle size={52} color='#4B5563' />
            </div>
            <h1 style={titleStyle}>Paiement Introuvable</h1>
            <p style={textStyle}>
              Nous n'avons pas pu associer cette référence à une transaction valide dans notre système.
            </p>
            {reference && <div style={referenceBoxStyle}>Réf : {reference}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button variant='super' label='Retour' onClick={() => navigate(source)} style={{ width: '100%' }} />
            </div>
          </>
        )
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {renderContent()}
      </div>
    </div>
  )
}

export default PaiementStatusPage
