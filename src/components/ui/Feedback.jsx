import React from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'
import './Feedback.css'

const Feedback = ({
  type = 'info',
  title,
  message,
  onClose,
  theme = 'light',
  className = '',
  autoHide = false,
  autoHideDuration = 5000,
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    const shouldAutoHide = autoHide || type === 'success'

    if (shouldAutoHide && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) onClose()
      }, autoHideDuration)
      return () => clearTimeout(timer)
    }
  }, [type, autoHide, autoHideDuration, isVisible, onClose])

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className='feedback-icon feedback-icon--success' />
      case 'error':
        return <XCircle className='feedback-icon feedback-icon--error' />
      case 'warning':
        return <AlertCircle className='feedback-icon feedback-icon--warning' />
      case 'info':
      default:
        return <Info className='feedback-icon feedback-icon--info' />
    }
  }

  return (
    <div className={`tresoria-feedback feedback--${theme} feedback--${type} ${className}`} {...props}>
      <div className='feedback-icon-wrapper'>
        {getIcon()}
      </div>
      <div className='feedback-content'>
        {title && <h4 className={`feedback-title text-${type}`}>{title}</h4>}
        {message && <p className='feedback-message'>{message}</p>}
      </div>
      {onClose ? (
        <button className='feedback-close-btn' onClick={onClose} aria-label='Close'>
          <X size={16} />
        </button>
      ) : (
        <button className='feedback-close-btn' onClick={() => setIsVisible(false)} aria-label='Close'>
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export default Feedback
