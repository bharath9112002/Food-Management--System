import { FormField } from '../FormField'
import { ADDRESS_TYPES } from './address'

// Controlled by the checkout page so it can validate everything on "Place order".
export default function AddressForm({ values, errors, touched, onChange, onBlur }) {
  const show = (field) => (touched[field] ? errors[field] : '')
  const field = (name) => ({
    id: `addr-${name}`,
    name,
    value: values[name],
    onChange: (e) => onChange(name, e.target.value),
    onBlur: () => onBlur(name),
    error: show(name),
  })

  return (
    <div className="address-form">
      <div className="form-row-2">
        <FormField label="Full name" autoComplete="name" placeholder="Name of the receiver" {...field('fullName')} />
        <FormField
          label="Phone number"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          autoComplete="tel-national"
          placeholder="10-digit mobile number"
          {...field('phone')}
        />
      </div>

      <FormField
        label="House / flat, street, area"
        autoComplete="street-address"
        placeholder="e.g. Flat 402, Lake View Apartments, MG Road"
        {...field('line1')}
      />
      <FormField label="Landmark (optional)" placeholder="e.g. Near City Mall" {...field('landmark')} />

      <div className="form-row-2">
        <FormField label="City" autoComplete="address-level2" placeholder="e.g. Bengaluru" {...field('city')} />
        <FormField
          label="Pincode"
          inputMode="numeric"
          maxLength={6}
          autoComplete="postal-code"
          placeholder="6-digit pincode"
          {...field('pincode')}
        />
      </div>

      <fieldset className="field choice-group">
        <legend>Save address as</legend>
        {ADDRESS_TYPES.map((t) => (
          <label key={t.value} className={`choice ${values.type === t.value ? 'selected' : ''}`}>
            <input
              type="radio"
              name="address-type"
              checked={values.type === t.value}
              onChange={() => onChange('type', t.value)}
            />
            <span aria-hidden="true">{t.icon}</span>
            {t.value}
          </label>
        ))}
      </fieldset>
    </div>
  )
}
