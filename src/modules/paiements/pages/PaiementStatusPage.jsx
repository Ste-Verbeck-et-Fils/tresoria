import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getPaiements } from '../../../services/paiementService'

const PaiementStatusPage = () => {
  const [searchParams] = useSearchParams()
  const rawReference = searchParams.get('ref')
  const urlStatus = searchParams.get('status')
  const source = searchParams.get('source') || '/paiements'

  // Nettoyage de la référence au cas où MaishaPay rajoute /?status=...
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

  useEffect(() => {
    const processStatus = async () => {
      if (!reference) {
        navigate(source, { replace: true, state: { successMessage: 'Aucune référence de paiement fournie.' } })
        return
      }

      if (urlStatus === 'cancelled') {
        navigate(source, { replace: true, state: { successMessage: 'Le paiement a été annulé par l\'utilisateur.' } })
        return
      }

      try {
        const response = await getPaiements({ reference })
        const paiements = response?.data?.paiements || response?.paiements || response?.data || []
        const foundPaiement = paiements.find(p => p.reference === reference)

        if (!foundPaiement) {
          // Si le paiement n'est pas trouvé (probablement effacé par le cron après 90s)
          navigate(source, { replace: true, state: { successMessage: 'Le délai est dépassé, le paiement a été supprimé.' } })
          return
        }

        if (foundPaiement.statut === 'CONFIRME') {
          navigate(source, { replace: true, state: { successMessage: 'Paiement confirmé avec succès par MaishaPay !' } })
        } else if (foundPaiement.statut === 'ANNULE') {
          navigate(source, { replace: true, state: { successMessage: 'Le paiement a été annulé ou a échoué.' } })
        } else {
          // EN_ATTENTE
          navigate(source, { replace: true, state: { successMessage: 'Le paiement est en attente de confirmation de votre opérateur...' } })
        }
      } catch (error) {
        console.error(error)
        navigate(source, { replace: true, state: { successMessage: 'Erreur lors de la vérification du statut du paiement.' } })
      }
    }

    processStatus()
  }, [reference, urlStatus, navigate, source])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui' }}>
      <p style={{ color: '#4B5563' }}>Vérification du statut de votre paiement...</p>
    </div>
  )
}

export default PaiementStatusPage
