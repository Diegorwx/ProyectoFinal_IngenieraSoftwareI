import React, { useState, useEffect, useMemo } from 'react'
import {
  clientesApi, pedidosApi, fmtCOP, fmtFechaCorta, iniciales, nombreProducto, formatPedidoId, unidadesPedido
} from '../api.js'
import { Badge } from '../components.jsx'
import { DetallePedidoDrawer } from './Pedidos.jsx'
import {
  IconHome, IconChev, IconChevL, IconSearch, IconLoad, IconAlert, IconX, IconUser, IconBag, IconReceipt, IconCheck
} from '../icons.jsx'

const PAGE_SIZE = 10

// Un pedido cancelado no cuenta como compra
const esCompra = (p) => p.estadoPedido !== 'CANCELADO'

// ============================================================
// Panel de clientes (extra, fuera del alcance del MVP)
// Muestra los datos de cada cliente y su historial de compras.
// ============================================================
export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState('TODOS')
  const [page, setPage] = useState(1)
  const [seleccionado, setSeleccionado] = useState(null)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      const [cs, ps] = await Promise.all([clientesApi.listarTodos(), pedidosApi.todos()])   // GET /api/clientes, GET /api/pedidos
      setClientes(cs)
      setPedidos(ps)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Resumen de compras por cliente
  const resumen = useMemo(() => {
    const r = {}
    for (const c of clientes) r[c.id] = { pedidos: 0, total: 0, ultima: null }
    for (const p of pedidos.filter(esCompra)) {
      const x = r[p.cliente.id]
      if (!x) continue
      x.pedidos += 1
      x.total += Number(p.valorTotal)
      if (!x.ultima || p.fecha > x.ultima) x.ultima = p.fecha
    }
    return r
  }, [clientes, pedidos])

  const stats = useMemo(() => ({
    total: clientes.length,
    activos: clientes.filter(c => c.estadoCliente === 'ACTIVO').length,
    conCompras: clientes.filter(c => resumen[c.id]?.pedidos > 0).length,
    vendido: Object.values(resumen).reduce((s, x) => s + x.total, 0),
  }), [clientes, resumen])

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clientes.filter(c => {
      if (filtro !== 'TODOS' && c.estadoCliente !== filtro) return false
      if (!q) return true
      return c.nombre.toLowerCase().includes(q) || c.telefono.includes(q)
        || (c.direccion || '').toLowerCase().includes(q)
    })
  }, [clientes, query, filtro])

  useEffect(() => { setPage(1) }, [query, filtro])

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paged = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-400)' }}>
        <IconLoad size={28} style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: 12 }}>Cargando clientes…</div>
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
          <div className="crumb"><IconHome size={11} /> Consulta <IconChev size={11} /> Clientes</div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-sub">Datos de contacto de cada cliente y el historial de sus compras.</p>
        </div>
      </div>

      <div className="stat-strip">
        <StatCard label="Total clientes" value={stats.total} icon={<IconUser size={14} />} />
        <StatCard label="Activos" value={stats.activos} icon={<IconCheck size={14} />} />
        <StatCard label="Con compras" value={stats.conCompras} icon={<IconBag size={14} />} />
        <StatCard label="Total vendido" value={fmtCOP(stats.vendido)} icon={<IconReceipt size={14} />} />
      </div>

      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 14 }}>
          <div className="toolbar">
            <div className="search-box">
              <IconSearch size={15} />
              <input className="input" placeholder="Buscar por nombre, teléfono o dirección…"
                     value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar cliente" />
            </div>
            {['TODOS', 'ACTIVO', 'INACTIVO'].map(est => (
              <button key={est}
                      className={'filter-chip ' + (filtro === est ? 'is-active' : '')}
                      onClick={() => setFiltro(est)}>
                {est === 'ACTIVO' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />}
                {est === 'INACTIVO' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} />}
                {est === 'TODOS' ? 'Todos' : est === 'ACTIVO' ? 'Activos' : 'Inactivos'}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          {paged.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <IconSearch size={28} style={{ color: 'var(--ink-300)' }} />
              <div style={{ marginTop: 12, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink-700)' }}>
                {clientes.length === 0 ? 'Aún no hay clientes' : 'Sin resultados'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 4 }}>
                {clientes.length === 0
                  ? 'Los clientes se registran desde «Registrar pedido».'
                  : 'No encontramos clientes con esos criterios.'}
              </div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th><th>Teléfono</th><th>Dirección</th><th>Canal</th>
                  <th>Estado</th><th>Compras</th><th>Total comprado</th><th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(c => {
                  const r = resumen[c.id]
                  return (
                    <tr key={c.id} className={c.estadoCliente === 'INACTIVO' ? 'is-inactive' : ''}>
                      <td>
                        <div className="cell-name">
                          <div className="avatar">{iniciales(c.nombre)}</div>
                          {c.nombre}
                        </div>
                      </td>
                      <td className="cell-doc">{c.telefono}</td>
                      <td>{c.direccion || '—'}</td>
                      <td>{c.canalContacto || '—'}</td>
                      <td><Badge estado={c.estadoCliente} /></td>
                      <td>{r.pedidos}</td>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink-900)' }}>
                        {fmtCOP(r.total)}
                      </td>
                      <td className="cell-actions">
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }}
                                onClick={() => setSeleccionado(c)}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="card-foot">
          <div className="pg-info">
            Mostrando <b>{paged.length}</b> de <b>{filtrados.length}</b> {filtrados.length === 1 ? 'cliente' : 'clientes'}
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

      {seleccionado && (
        <ClienteDrawer cliente={seleccionado} onClose={() => setSeleccionado(null)} />
      )}
    </>
  )
}

// ---- Subcomponentes ----

function StatCard({ label, value, icon }) {
  return (
    <div className="stat">
      <div className="lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--ink-400)' }}>{icon}</span> {label}
      </div>
      <div className="val">{value}</div>
    </div>
  )
}

function ClienteDrawer({ cliente, onClose }) {
  const [pedidos, setPedidos] = useState(null)
  const [error, setError] = useState('')
  const [pedidoAbierto, setPedidoAbierto] = useState(null)

  useEffect(() => {
    pedidosApi.porCliente(cliente.id)   // GET /api/pedidos?clienteId=
      .then(ps => setPedidos([...ps].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)))
      .catch(err => setError(err.message))
  }, [cliente.id])

  const compras = (pedidos || []).filter(esCompra)
  const total = compras.reduce((s, p) => s + Number(p.valorTotal), 0)
  const unidades = compras.reduce((s, p) => s + unidadesPedido(p), 0)

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label={'Cliente ' + cliente.nombre}>
        <div className="drawer-head">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="entity-avatar">{iniciales(cliente.nombre)}</div>
            <div>
              <h2>{cliente.nombre}</h2>
              <div className="sub" style={{ marginTop: 4 }}><Badge estado={cliente.estadoCliente} /></div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar"><IconX size={14} /></button>
        </div>

        <div className="drawer-body">
          <div className="detail-block">
            <div className="detail-title">Datos de contacto</div>
            <div className="kv"><span className="k">Teléfono</span><span className="v">{cliente.telefono}</span></div>
            <div className="kv"><span className="k">Dirección</span><span className="v">{cliente.direccion || '—'}</span></div>
            <div className="kv"><span className="k">Canal de contacto</span><span className="v">{cliente.canalContacto || '—'}</span></div>
          </div>

          <div className="detail-block">
            <div className="detail-title">Resumen de compras</div>
            <div className="kv"><span className="k">Pedidos</span><span className="v">{compras.length}</span></div>
            <div className="kv"><span className="k">Unidades compradas</span><span className="v">{unidades}</span></div>
            <div className="receipt-total" style={{ marginTop: 8 }}>
              <span className="k">Total comprado</span>
              <span className="v">{fmtCOP(total)}</span>
            </div>
          </div>

          <div className="detail-title" style={{ marginTop: 18 }}>Historial de pedidos</div>
          {error && <div className="inline-msg is-error" role="alert"><IconAlert size={14} /><div>{error}</div></div>}
          {!pedidos && !error && (
            <div style={{ color: 'var(--ink-400)', fontSize: 13 }}>
              <IconLoad size={14} style={{ animation: 'spin 1s linear infinite', verticalAlign: '-2px' }} /> Cargando…
            </div>
          )}
          {pedidos && pedidos.length === 0 && (
            <div className="empty-state">
              <IconBag size={20} />
              <div style={{ marginTop: 6 }}>Este cliente todavía no tiene pedidos.</div>
            </div>
          )}
          {pedidos && pedidos.map(p => (
            <div className="order-card" key={p.id}>
              <div className="order-card-head">
                <button className="link-btn" onClick={() => setPedidoAbierto(p)}>{formatPedidoId(p.id)}</button>
                <Badge estado={p.estadoPedido} />
              </div>
              <div className="order-items">
                {p.detalles.map(d => `${d.cantidad} × ${nombreProducto(d.producto)}`).join(' · ')}
              </div>
              <div className="kv" style={{ paddingBottom: 0 }}>
                <span className="k">{fmtFechaCorta(p.fecha)}</span>
                <span className="v">{fmtCOP(p.valorTotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>

      {pedidoAbierto && (
        <div style={{ position: 'relative', zIndex: 110 }}>
          <DetallePedidoDrawer pedido={pedidoAbierto} onClose={() => setPedidoAbierto(null)} />
        </div>
      )}
    </>
  )
}
