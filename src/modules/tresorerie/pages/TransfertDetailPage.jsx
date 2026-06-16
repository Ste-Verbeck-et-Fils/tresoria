import Loader from '../../../components/ui/Loader'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Ban, FileText } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import { getTransfertById, annulerTransfert } from '../../../services/transfertService'
import PasswordConfirmModal from '../../../components/ui/PasswordConfirmModal'
import DetailField from '../../inscriptions/components/DetailField'
import DetailSection from '../../inscriptions/components/DetailSection'
import DetailSummaryCard from '../../inscriptions/components/DetailSummaryCard'
import ModuleState from '../../inscriptions/components/ModuleState'
import StatusBadge from '../../inscriptions/components/StatusBadge'
import { formatDate } from '../../inscriptions/utils/data'
import { formatAmount } from '../../inscriptions/utils/amounts'

const TransfertDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()

  const [transfert, setTransfert] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const [isCancelling, setIsCancelling] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const loadTransfertData = async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const data = await getTransfertById(id)
      setTransfert(data?.data || data)
    } catch (error) {
      setLoadError(error.message || 'Impossible de charger ce transfert.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    const fetchTransfert = async () => {
      try {
        const data = await getTransfertById(id)
        if (!isCancelled) {
          setTransfert(data?.data || data)
          setLoadError('')
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error.message || 'Impossible de charger ce transfert.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchTransfert()

    return () => {
      isCancelled = true
    }
  }, [id])

  const handlePasswordConfirm = () => {
    setShowPasswordModal(false)
    if (pendingAction === 'annuler') {
      executeAnnuler()
    }
    setPendingAction(null)
  }

  const handleAnnuler = () => {
    setPendingAction('annuler')
    setShowPasswordModal(true)
  }

  const executeAnnuler = async () => {
    setFeedback({ type: '', message: '' })
    setIsCancelling(true)

    try {
      await annulerTransfert(id)
      setFeedback({ type: 'success', message: 'Transfert annulé avec succes.' })
      await loadTransfertData()
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Impossible d annuler ce transfert.' })
    } finally {
      setIsCancelling(false)
    }
  }

  const isTransfertCancelled = String(transfert?.statut || '').toUpperCase().startsWith('ANNUL')

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <Link to='/tresorerie/transferts' className='inscription-back-link'>
            <ArrowLeft size={16} />
            Retour aux transferts
          </Link>
          <h1>Detail du transfert #{id}</h1>
        </div>
      </header>

      {location.state?.successMessage && <Feedback type='success' message={location.state.successMessage} />}

      {feedback.message && (
        <Feedback
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}

      {isLoading && <Loader message='Chargement du transfert...' />}

      {!isLoading && loadError && (
        <ModuleState
          type='error'
          title='Echec du chargement'
          message={loadError}
          actionLabel='Reessayer'
          onAction={loadTransfertData}
        />
      )}

      {!isLoading && !loadError && transfert && (
        <div className='detail-page-stack'>
          <DetailSummaryCard
            icon={<FileText size={36} aria-hidden='true' />}
            title={`Transfert ${transfert.reference || '#' + transfert.id}`}
            subtitle={formatAmount(transfert.montant)}
            meta={`Le ${formatDate(transfert.date_mouvement)}`}
            badge={<StatusBadge value={transfert.statut} />}
          />

          <DetailSection
            title='Informations du transfert'
          >
            <DetailField label='Reference' value={transfert.reference || '#' + transfert.id} />
            <DetailField label='Date de transfert' value={formatDate(transfert.date_mouvement)} />
            <DetailField label='Montant' value={formatAmount(transfert.montant)} />
            <DetailField label='Compte source' value={transfert.compte_source?.nom || '-'} />
            <DetailField label='Compte destination' value={transfert.compte_destination?.nom || '-'} />
            <DetailField label='Statut' value={<StatusBadge value={transfert.statut} />} />
            <DetailField label='Description' value={transfert.description || '-'} />
            <DetailField label='Crée par' value={transfert.creator?.full_name || transfert.creator?.phone || '-'} />
          </DetailSection>

          <DetailSection
            title='Actions'
            actions={(
              <>
                <Button
                  type='button'
                  variant='ghost'
                  label={isCancelling ? 'Annulation...' : 'Annuler le transfert'}
                  icon={<Ban size={16} />}
                  loading={isCancelling}
                  disabled={isTransfertCancelled}
                  onClick={handleAnnuler}
                  className='inscription-action inscription-action--secondary'
                />
              </>
            )}
          >
            <DetailField label='Date de creation' value={formatDate(transfert.created_at || transfert.createdAt)} />
            <DetailField label='Derniere modification' value={formatDate(transfert.updated_at || transfert.updatedAt)} />
          </DetailSection>
        </div>
      )}

      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setPendingAction(null) }}
        onConfirm={handlePasswordConfirm}
        title='Confirmation requise'
        message='Veuillez saisir votre mot de passe pour confirmer l annulation du transfert.'
        actionLabel='Annuler le transfert'
      />
    </section>
  )
}

export default TransfertDetailPage
