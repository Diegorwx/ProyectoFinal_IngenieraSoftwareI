import React, { useState, useEffect, useMemo } from 'react'
import {
  pedidosApi, fmtCOP, fmtFechaCorta, hoyISO, nombreProducto, formatPedidoId, textoEntrega, textoEntregaCorto, unidadesPedido
} from '../api.js'
import { Badge } from '../components.jsx'
import {
  IconHome, IconChev, IconChevL, IconSearch, IconLoad, IconAlert, IconX, IconReceipt, IconBag, IconCheck, IconClock
} from '../icons.jsx'

const PAGE_SIZE = 10

const FILTROS = [
  { valor: 'TODOS',             texto: 'Todos' },
  { valor: 'PENDIENTE_DE_PAGO', texto: 'Pendientes de pago', color: '#b8860b' },
  { valor: 'PAGADO',            texto: 'Pagados',            color: '#1f5fa8' },
  { valor: 'ENTREGADO',         texto: 'Entregados',         color: 'var(--success)' },
  { valor: 'CANCELADO',         texto: 'Cancelados',         color: 'var(--ink-400)' },
]

// ============================================================
// Panel de pedidos (extra, fuera del alcance del MVP)
// Consulta los pedidos por estado, muestra su detalle y permite
// cancelar un pedido pendiente (CUS-02 FA-6, RN-013).
// ============================================================
export default function Pedidos({ pushToast }) {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState('TODOS')
  const [page, setPage] = useState(1)
  const [detalle, setDetalle] = useState(null)
  const [porCancelar, setPorCancelar] = useState(null)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      setPedidos(await pedidosApi.todos())   // GET /api/pedidos
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const ordenados = useMemo(
    () => [...pedidos].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id),
    [pedidos]
  )

  const contar = (estado) => pedidos.filter(p => p.estadoPedido === estado).length
  const porCobrar = pedidos
    .filter(p => p.estadoPedido === 'PENDIENTE_DE_PAGO')
    .reduce((s, p) => s + Number(p.valorTotal), 0)

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ordenados.filter(p => {
      if (filtro !== 'TODOS' && p.estadoPedido !== filtro) return false
      if (!q) return true
      return formatPedidoId(p.id).toLowerCase().includes(q)
        || p.cliente.nombre.toLowerCase().includes(q)
        || p.cliente.telefono.includes(q)
    })
  }, [ordenados, query, filtro])

  useEffect(() => { setPage(1) }, [query, filtro])

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paged = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // CUS-02 FA-6: cancelar un pedido pendiente libera el inventario
  const cancelar = async (pedido) => {
    try {
      const actualizado = await pedidosApi.cancelar(pedido.id)   // PATCH /api/pedidos/{id}/cancelar
      setPedidos(prev => prev.map(p => p.id === actualizado.id ? actualizado : p))
      setDetalle(actualizado)
      pushToast('success', `Pedido ${formatPedidoId(pedido.id)} cancelado. Los productos vuelven a estar disponibles.`)
    } catch (err) {
      pushToast('error', err.message)
    } finally {
      setPorCancelar(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-400)' }}>
        <IconLoad size={28} style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: 12 }}>Cargando pedidos…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-state">
        <IconAlert size={28} />
        <div style={{ marginTop: 12, fontWeight: 600 }}>Error al cargar los datos</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>{error}</div>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={cargarDatos}>Reintentar</button>
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="crumb"><IconHome size={11} /> Consulta <IconChev size={11} /> Pedidos</div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-sub">Consulta los pedidos por estado y revisa el detalle de cada uno.</p>
        </div>
      </div>

      <div className="stat-strip">
        <StatCard label="Pendientes de pago" value={contar('PENDIENTE_DE_PAGO')} sub={`${fmtCOP(porCobrar)} por cobrar`} icon={<IconClock size={14} />} />
        <StatCard label="Pagados" value={contar('PAGADO')} sub="Por entregar" icon={<IconReceipt size={14} />} />
        <StatCard label="Entregados" value={contar('ENTREGADO')} icon={<IconCheck size={14} />} />
        <StatCard label="Cancelados" value={contar('CANCELADO')} icon={<IconX size={14} />} />
      </div>

      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 14 }}>
          <div className="toolbar">
            <div className="search-box">
              <IconSearch size={15} />
              <input className="input" placeholder="Buscar por código, cliente o teléfono…"
                     value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar pedido" />
            </div>
            {FILTROS.map(f => (
              <button key={f.valor}
                      className={'filter-chip ' + (filtro === f.valor ? 'is-active' : '')}
                      onClick={() => setFiltro(f.valor)}>
                {f.color && <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.color }} />}
                {f.texto}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          {paged.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <IconBag size={28} style={{ color: 'var(--ink-300)' }} />
              <div style={{ marginTop: 12, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink-700)' }}>
                {pedidos.length === 0 ? 'Aún no hay pedidos' : 'Sin resultados'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 4 }}>
                {pedidos.length === 0
                  ? 'Los pedidos registrados aparecerán aquí.'
                  : 'No hay pedidos con esos criterios.'}
              </div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th><th>Fecha</th><th>Cliente</th><th>Productos</th>
                  <th>Entrega</th><th>Total</th><th>Estado</th><th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(p => (
                  <tr key={p.id} className={p.estadoPedido === 'CANCELADO' ? 'is-inactive' : ''}>
                    <td className="cell-doc nowrap">{formatPedidoId(p.id)}</td>
                    <td className="nowrap">{fmtFechaCorta(p.fecha)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{p.cliente.nombre}</td>
                    <td className="nowrap">{unidadesPedido(p)} unidad(es)</td>
                    <td className="nowrap">{textoEntregaCorto(p.tipoEntrega)}</td>
                    <td className="nowrap" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink-900)' }}>
                      {fmtCOP(p.valorTotal)}
                    </td>
                    <td className="nowrap"><Badge estado={p.estadoPedido} /></td>
                    <td className="cell-actions">
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }}
                              onClick={() => setDetalle(p)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card-foot">
          <div className="pg-info">
            Mostrando <b>{paged.length}</b> de <b>{filtrados.length}</b> {filtrados.length === 1 ? 'pedido' : 'pedidos'}
          </div>
          <div className="pagination">
            <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><IconChevL size={12} /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} className={'pg-btn ' + (n === page ? 'is-active' : '')} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><IconChev size={12} /></button>
          </div>
        </div>
      </div>

      {detalle && (
        <DetallePedidoDrawer pedido={detalle}
                             onClose={() => setDetalle(null)}
                             onCancelar={() => setPorCancelar(detalle)} />
      )}
      {porCancelar && (
        <ConfirmarCancelacion pedido={porCancelar}
                              onCancel={() => setPorCancelar(null)}
                              onConfirm={() => cancelar(porCancelar)} />
      )}
    </>
  )
}

// ---- Subcomponentes ----

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="stat">
      <div className="lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--ink-400)' }}>{icon}</span> {label}
      </div>
      <div className="val">{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function DetallePedidoDrawer({ pedido, onClose, onCancelar }) {
  const vencido = pedido.estadoPedido === 'PENDIENTE_DE_PAGO' && pedido.fechaLimitePago < hoyISO()
  const subtotal = pedido.detalles.reduce((s, d) => s + Number(d.subtotal), 0)

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label={'Detalle del pedido ' + formatPedidoId(pedido.id)}>
        <div className="drawer-head">
          <div>
            <h2>{formatPedidoId(pedido.id)}</h2>
            <div className="sub" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Badge estado={pedido.estadoPedido} /> {fmtFechaCorta(pedido.fecha)}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar"><IconX size={14} /></button>
        </div>

        <div className="drawer-body">
          <div className="detail-block">
            <div className="detail-title">Cliente</div>
            <div className="kv"><span className="k">Nombre</span><span className="v">{pedido.cliente.nombre}</span></div>
            <div className="kv"><span className="k">Teléfono</span><span className="v">{pedido.cliente.telefono}</span></div>
            <div className="kv"><span className="k">Dirección</span><span className="v">{pedido.cliente.direccion || '—'}</span></div>
          </div>

          <div className="detail-block">
            <div className="detail-title">Productos</div>
            {pedido.detalles.map(d => (
              <div className="kv" key={d.producto.id}>
                <span className="k">{d.cantidad} × {nombreProducto(d.producto)} <span className="trace">({fmtCOP(d.valorUnitario)} c/u)</span></span>
                <span className="v">{fmtCOP(d.subtotal)}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--ink-200)', margin: '6px 0' }} />
            <div className="kv"><span className="k">Subtotal productos</span><span className="v">{fmtCOP(subtotal)}</span></div>
            <div className="kv"><span className="k">Costo del domicilio</span><span className="v">{fmtCOP(pedido.costoDomicilio)}</span></div>
            <div className="receipt-total" style={{ marginTop: 8 }}>
              <span className="k">Total</span>
              <span className="v">{fmtCOP(pedido.valorTotal)}</span>
            </div>
          </div>

          <div className="detail-block">
            <div className="detail-title">Entrega y pago</div>
            <div className="kv"><span className="k">Tipo de entrega</span><span className="v">{textoEntrega(pedido.tipoEntrega)}</span></div>
            <div className="kv"><span className="k">Plazo de pago</span>
              <span className="v" style={vencido ? { color: 'var(--danger)' } : {}}>
                {fmtFechaCorta(pedido.fechaLimitePago)}{vencido && ' · vencido'}
              </span>
            </div>
            <div className="kv"><span className="k">Fecha de entrega</span><span className="v">{pedido.fechaEntrega ? fmtFechaCorta(pedido.fechaEntrega) : '—'}</span></div>
            <div className="kv"><span className="k">Número de guía</span><span className="v">{pedido.numeroGuia || '—'}</span></div>
          </div>

          {vencido && (
            <div className="inline-msg is-warn" role="alert" style={{ marginTop: 12 }}>
              <IconAlert size={14} />
              <div><span className="code">RN-013</span> El plazo de pago venció. Se puede cancelar el pedido para liberar el inventario.</div>
            </div>
          )}
        </div>

        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          {pedido.estadoPedido === 'PENDIENTE_DE_PAGO' && onCancelar && (
            <button className="btn btn-danger" onClick={onCancelar}>
              <IconX size={13} /> Cancelar pedido
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function ConfirmarCancelacion({ pedido, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" style={{ zIndex: 120 }} onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 24px 18px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, margin: '0 0 6px' }}>
            ¿Cancelar {formatPedidoId(pedido.id)}?
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-500)', lineHeight: 1.5 }}>
            El pedido de <strong>{pedido.cliente.nombre}</strong> quedará cancelado y sus productos
            volverán a estar disponibles en el inventario. <span className="trace">CUS-02 FA-6</span>
          </p>
        </div>
        <div className="modal-foot" style={{ borderTop: '1px solid var(--ink-200)', background: 'var(--ink-50)' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Volver</button>
          <button className="btn btn-danger"
                  style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}
                  onClick={onConfirm}>
            Sí, cancelar pedido
          </button>
        </div>
      </div>
    </div>
  )
}
