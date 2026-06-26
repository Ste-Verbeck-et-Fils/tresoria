import React, { useState, useEffect, useRef } from 'react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Loader from '../../../components/ui/Loader'
import { getCheckoutData } from '../../../services/maishapayService'

const MaishaPayCheckout = ({ amount, devise = 'CDF', onSuccessCallbackUrl = '' }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [checkoutData, setCheckoutData] = useState(null)
  const formRef = useRef(null)

  const initiatePayment = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getCheckoutData(amount, devise, onSuccessCallbackUrl)
      if (result.success && result.checkoutParams) {
        setCheckoutData(result.checkoutParams)
      } else {
        setError("Impossible d'initialiser le paiement MaishaPay.")
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la préparation du paiement.')
      setLoading(false)
    }
  }

  // Automatiquement soumettre le formulaire quand checkoutData est prêt
  useEffect(() => {
    if (checkoutData && formRef.current) {
      formRef.current.submit()
    }
  }, [checkoutData])

  if (error) {
    return <Feedback type='error' message={error} onClose={() => setError(null)} />
  }

  if (loading) {
    return <Loader message='Redirection vers MaishaPay en cours...' />
  }

  return (
    <div>
      <Button
        onClick={initiatePayment}
        variant='super'
        style={{ width: '100%' }}
      >
        Payer avec MaishaPay ({amount} {devise})
      </Button>

      {/* Formulaire caché utilisé pour la redirection POST sécurisée */}
      {checkoutData && (
        <form
          ref={formRef}
          action={checkoutData.actionUrl}
          method='POST'
          style={{ display: 'none' }}
        >
          <input type='hidden' name='gatewayMode' value={checkoutData.gatewayMode} />
          <input type='hidden' name='publicApiKey' value={checkoutData.publicApiKey} />
          <input type='hidden' name='secretApiKey' value={checkoutData.secretApiKey} />
          <input type='hidden' name='callbackUrl' value={checkoutData.callbackUrl} />
          <input type='hidden' name='montant' value={checkoutData.montant} />
          <input type='hidden' name='devise' value={checkoutData.devise} />
        </form>
      )}
    </div>
  )
}

export default MaishaPayCheckout
