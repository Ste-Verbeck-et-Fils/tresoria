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
  ...props
}) => {
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
      {onClose && (
        <button className='feedback-close-btn' onClick={onClose} aria-label='Close'>
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export default Feedback
