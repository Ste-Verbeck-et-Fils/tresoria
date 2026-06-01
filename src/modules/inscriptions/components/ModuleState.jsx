import React from 'react'
import Feedback from '../../../components/ui/Feedback'
import Button from '../../../components/ui/Button'

const ModuleState = ({
  type = 'info',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <div className='inscription-state'>
      <Feedback type={type} title={title} message={message} />
      {actionLabel && onAction && (
        <Button
          type='button'
          variant='secondary'
          label={actionLabel}
          onClick={onAction}
          className='inscription-action inscription-action--secondary'
        />
      )}
    </div>
  )
}

export default ModuleState
