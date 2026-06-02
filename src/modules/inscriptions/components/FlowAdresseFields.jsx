import Input from '../../../components/ui/Input.jsx'

const FlowAdresseFields = ({
  idPrefix,
  form,
  errors = {},
  onChange,
  disabled = false,
}) => (
  <div className='full-flow-address-grid'>
    <Input
      id={`${idPrefix}-quartier`}
      label='Quartier'
      value={form.quartier}
      onChange={(event) => onChange('quartier', event.target.value)}
      error={errors.quartier}
      disabled={disabled}
      required
    />

    <Input
      id={`${idPrefix}-commune`}
      label='Commune'
      value={form.commune}
      onChange={(event) => onChange('commune', event.target.value)}
      disabled={disabled}
    />

    <Input
      id={`${idPrefix}-avenue`}
      label='Avenue'
      value={form.avenue}
      onChange={(event) => onChange('avenue', event.target.value)}
      disabled={disabled}
    />
  </div>
)

export default FlowAdresseFields
