import { getStoredUser } from '../../../utils/getStoredUser.js'
import { useWebAuthn } from '../../../hooks/useWebAuthn.js'
import { normalizeRole, ADMIN_ROLES } from '../../../utils/roles.js'
import Loader from '../../../components/ui/Loader'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, ShieldCheck, ShieldX } from 'lucide-react'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { getDevices, deleteDevice, updateDeviceStatus } from '../../../services/deviceService'
import '../../../styles/public/DevicesDashboard.css'

const mapApiErrorToMessage = (error) => {
  if (!error) return 'Impossible d\'enregistrer cet appareil.'
  if (typeof error === 'string') return error
  if (error.message) return error.message

  const status = error.status
  switch (status) {
    case 400:
      return 'Informations invalides.'
    case 401:
    case 403:
      return 'Session expirée. Veuillez vous reconnecter.'
    case 409:
      return 'Cet appareil existe déjà.'
    default:
      return 'Une erreur est survenue. Veuillez réessayer.'
  }
}

const EMPTY_VALUE = '-'

const DevicesDashboard = () => {
  const navigate = useNavigate()

  const [devices, setDevices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const [deviceForm, setDeviceForm] = useState({
    device_name: '',
  })
  const {
    register: registerDevice,
    resumeRegistration,
    isLoading: isRegistering,
    isFinalizing,
    isSupported,
    hasPendingRegistration,
  } = useWebAuthn()

  const [actionLoading, setActionLoading] = useState({})

  const currentUser = getStoredUser()
  const currentRole = currentUser?.role ? normalizeRole(currentUser.role) : ''
  const canChangeStatus = ADMIN_ROLES.includes(currentRole)

  useEffect(() => {
    const init = async () => {
      await fetchDevices()

      if (!hasPendingRegistration) return

      setFeedback({
        type: 'success',
        message: 'Finalisation de l\'enregistrement en cours. Ne fermez pas le navigateur.',
      })

      try {
        await resumeRegistration()
        setDeviceForm({ device_name: '' })
        await fetchDevices()
        setFeedback({ type: 'success', message: 'Device ajouté avec succès.' })
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          navigate('/login', { replace: true })
          return
        }
        setFeedback({
          type: 'error',
          message: mapApiErrorToMessage(error),
        })
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDevices = async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const data = await getDevices()
      setDevices(data.devices || [])
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        navigate('/login', { replace: true })
        return
      }
      setLoadError('Impossible de charger les devices.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormChange = (event) => {
    const { id, value } = event.target
    setDeviceForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleAddDevice = async (event) => {
    event.preventDefault()

    if (isRegistering) {
      return
    }

    setFeedback({ type: '', message: '' })

    if (!isSupported) {
      setFeedback({
        type: 'error',
        message: 'Votre navigateur ne prend pas en charge l\'authentification biométrique.',
      })
      return
    }

    try {
      await registerDevice(deviceForm.device_name)
      setDeviceForm({ device_name: '' })
      await fetchDevices()
      setFeedback({ type: 'success', message: 'Device ajouté avec succès.' })
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        navigate('/login', { replace: true })
        return
      }
      setFeedback({ type: 'error', message: mapApiErrorToMessage(error) })
    }
  }

  const handleDeleteDevice = async (id) => {
    if (!window.confirm('Supprimer ce device ?')) {
      return
    }

    setFeedback({ type: '', message: '' })
    setActionLoading((prev) => ({ ...prev, [id]: true }))

    try {
      await deleteDevice(id)
      setDevices((prev) => prev.filter((d) => d.id !== id))
      setFeedback({ type: 'success', message: 'Device supprimé avec succès.' })
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        navigate('/login', { replace: true })
        return
      }
      setFeedback({ type: 'error', message: mapApiErrorToMessage(error) })
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    if (!canChangeStatus) {
      setFeedback({ type: 'error', message: 'Vous n\'avez pas les permissions pour modifier le statut d\'un device.' })
      return
    }

    setFeedback({ type: '', message: '' })
    setActionLoading((prev) => ({ ...prev, [`status_${id}`]: true }))

    const statusOrder = ['ACTIF', 'INACTIF', 'BLOQUE']
    const currentIndex = statusOrder.indexOf(currentStatus)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

    try {
      const updatedDevice = await updateDeviceStatus(id, nextStatus)
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: updatedDevice.status } : d))
      )
      setFeedback({ type: 'success', message: 'Statut du device mis à jour.' })
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        navigate('/login', { replace: true })
        return
      }
      setFeedback({ type: 'error', message: mapApiErrorToMessage(error) })
    } finally {
      setActionLoading((prev) => ({ ...prev, [`status_${id}`]: false }))
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='devices-dashboard__state'>
          <Loader message='Chargement des devices...' />
        </div>
      )
    }

    if (loadError) {
      return (
        <div className='devices-dashboard__state'>
          <Feedback type='error' title='Erreur' message={loadError} />
          <Button type='button' variant='secondary' label='Recharger' onClick={fetchDevices} />
        </div>
      )
    }

    const colClass = devices.length === 0 ? 'devices-form--single-col' : ''

    return (
      <>
        <article className='devices-section-card'>
          <div className='devices-section-card__header'>
            <h2 className='devices-section-card__title'>Ajouter un nouveau device</h2>
          </div>

          <form className={`devices-form ${colClass}`} onSubmit={handleAddDevice}>
            <div className='devices-form__field'>
              <Input
                id='device_name'
                type='text'
                label='Nom du device'
                placeholder='Nom du device (optionnel)'
                value={deviceForm.device_name}
                onChange={handleFormChange}
                disabled={isRegistering}
              />
            </div>

            <div className='devices-form__actions'>
              <Button
                type='submit'
                variant='super'
                label={
                  isFinalizing
                    ? 'Finalisation...'
                    : isRegistering
                      ? 'Enregistrement...'
                      : 'Enregistrer mon appareil'
                }
                disabled={isRegistering}
                loading={isRegistering}
                className='devices-action-button devices-action-button--primary'
              />
            </div>
          </form>
        </article>

        <article className='devices-section-card'>
          <div className='devices-section-card__header'>
            <h2 className='devices-section-card__title'>Liste des devices</h2>
          </div>

          {devices.length === 0
            ? (
              <p className='devices-empty'>Aucun device enregistré.</p>
              )
            : (
              <div className='devices-table-container'>
                <table className='devices-table'>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Statut</th>
                      <th>Date de création</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => (
                      <tr key={device.id}>
                        <td>{device.device_name || EMPTY_VALUE}</td>
                        <td>
                          <span
                            className={`devices-status ${
                              device.status === 'ACTIF'
                                ? 'devices-status--success'
                                : device.status === 'BLOQUE'
                                  ? 'devices-status--pending'
                                  : 'devices-status--warning'
                            }`}
                          >
                            {device.status || 'INCONNU'}
                          </span>
                        </td>
                        <td>
                          {device.created_at
                            ? new Date(device.created_at).toLocaleDateString('fr-FR')
                            : EMPTY_VALUE}
                        </td>
                        <td>
                          <div className='devices-actions'>
                            <button
                              type='button'
                              className='devices-action-button devices-action-button--icon'
                              onClick={() => handleToggleStatus(device.id, device.status)}
                              disabled={!canChangeStatus || actionLoading[`status_${device.id}`]}
                              aria-label={
                                device.status === 'ACTIF' ? 'Désactiver le device' : 'Activer le device'
                              }
                            >
                              {device.status === 'ACTIF' ? <ShieldX size={16} /> : <ShieldCheck size={16} />}
                            </button>
                            <button
                              type='button'
                              className='devices-action-button devices-action-button--icon devices-action-button--danger'
                              onClick={() => handleDeleteDevice(device.id)}
                              disabled={actionLoading[device.id]}
                              aria-label='Supprimer le device'
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
        </article>
      </>
    )
  }

  return (
    <section className='devices-dashboard'>
      <h1 className='devices-dashboard__title'>Mes devices</h1>

      {feedback.message && (
        <Feedback
          type={feedback.type}
          message={feedback.message}
          className='devices-dashboard__feedback'
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}

      {renderContent()}
    </section>
  )
}

export default DevicesDashboard
