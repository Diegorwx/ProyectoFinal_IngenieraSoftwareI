import React from 'react'
import { IconAlert } from './icons.jsx'

// Componentes compartidos por las dos pantallas

export function Badge({ estado }) {
  const map = {
    ACTIVO:            { cls: 'badge-success', label: 'Activo' },
    INACTIVO:          { cls: 'badge-danger',  label: 'Inactivo' },
    DISPONIBLE:        { cls: 'badge-success', label: 'Disponible' },
    AGOTADO:           { cls: 'badge-danger',  label: 'Agotado' },
    PENDIENTE_DE_PAGO: { cls: 'badge-pending', label: 'Pendiente de pago' },
    PAGADO:            { cls: 'badge-success', label: 'Pagado' },
    ENTREGADO:         { cls: 'badge-success', label: 'Entregado' },
    CANCELADO:         { cls: 'badge-neutral', label: 'Cancelado' },
  }
  const m = map[estado] || { cls: 'badge-neutral', label: estado }
  return <span className={'badge ' + m.cls}><span className="dot" />{m.label}</span>
}

// Mensaje en línea. "code" muestra la regla o flujo alterno (trazabilidad).
export function InlineMsg({ kind = 'error', code, children }) {
  return (
    <div className={'inline-msg is-' + kind} role="alert">
      <IconAlert size={14} />
      <div>
        {code && <span className="code">{code}</span>} {children}
      </div>
    </div>
  )
}

export function FormField({ label, required, error, hint, children }) {
  return (
    <div className="field">
      <label>{label} {required && <span className="req" aria-hidden="true">*</span>}</label>
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && (
        <span style={{ fontSize: 11.5, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}
              role="alert">
          <IconAlert size={11} /> {error}
        </span>
      )}
    </div>
  )
}
