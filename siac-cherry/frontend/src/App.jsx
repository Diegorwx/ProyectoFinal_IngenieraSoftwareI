import React, { useState } from 'react'
import RegistrarPedido from './screens/RegistrarPedido.jsx'
import Productos from './screens/Productos.jsx'
import { IconBag, IconBox } from './icons.jsx'

export default function App() {
  const [tab, setTab] = useState('pedido')
  const [toasts, setToasts] = useState([])

  const pushToast = (kind, text) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, kind, text }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sb-brand">
          <div className="sb-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="16" r="4" />
              <circle cx="17" cy="17" r="3.5" />
              <path d="M8 12c1-5 5-8 10-9M17 13.5c0-4 0-7 1-10.5" />
            </svg>
          </div>
          <div className="sb-brand-text">
            <div className="t1">SIAC · Cherry</div>
            <div className="t2">Atención al cliente</div>
          </div>
        </div>

        <div>
          <div className="sb-section-label">Operación</div>
          <nav className="sb-nav">
            <button className={'sb-link ' + (tab === 'pedido' ? 'active' : '')} onClick={() => setTab('pedido')}>
              <IconBag size={16} /> Registrar pedido
            </button>
            <button className={'sb-link ' + (tab === 'productos' ? 'active' : '')} onClick={() => setTab('productos')}>
              <IconBox size={16} /> Productos
            </button>
          </nav>
        </div>

        <div className="sb-foot">
          <div className="sb-avatar">ER</div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 12.5 }}>Encargada de Redes</div>
            <div>Cherry · Armenia</div>
          </div>
        </div>
      </aside>

      <main className="main">
        {tab === 'pedido' && <RegistrarPedido pushToast={pushToast} />}
        {tab === 'productos' && <Productos pushToast={pushToast} />}
      </main>

      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast is-${t.kind}`}>
            <span className="dot" />
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}
