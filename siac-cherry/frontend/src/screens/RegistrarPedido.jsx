import React, { useState, useMemo } from 'react'
import {
  clientesApi, productosApi, pedidosApi, fmtCOP, fmtFechaCorta, hoyISO, iniciales,
  nombreProducto, formatPedidoId, MEDIOS_PAGO, COSTO_DOMICILIO_ARMENIA, TIPOS_ENTREGA
} from '../api.js'
import { Badge, InlineMsg, FormField } from '../components.jsx'
import {
  IconHome, IconChev, IconUser, IconReceipt, IconCheck, IconLoad, IconInfo, IconPlus, IconX, IconBag
} from '../icons.jsx'

// ============================================================
// Pantalla 1 — Registrar pedido (CUS-02)
// Los nombres de los campos son los atributos del Diagrama de Clases.
// ============================================================
export default function RegistrarPedido({ pushToast }) {
  // ---- Cliente (pasos 3 y 4 del flujo básico) ----
  const [clienteQuery, setClienteQuery] = useState('')
  const [clienteResults, setClienteResults] = useState(null)
  const [loadingCliente, setLoadingCliente] = useState(false)
  const [cliente, setCliente] = useState(null)
  const [nuevoCliente, setNuevoCliente] = useState(null)   // formulario del flujo alterno 2

  // ---- Productos del pedido (pasos 5 a 7) ----
  const [productoQuery, setProductoQuery] = useState('')
  const [productoResults, setProductoResults] = useState(null)
  const [loadingProducto, setLoadingProducto] = useState(false)
  const [items, setItems] = useState([])                   // [{ producto, cantidad }]

  // ---- Entrega y pago (pasos 8 y 9) ----
  const [tipoEntrega, setTipoEntrega] = useState('TIENDA')
  const [fechaLimitePago, setFechaLimitePago] = useState('')

  // ---- Confirmación (pasos 10 a 14) ----
  const [submitting, setSubmitting] = useState(false)
  const [intentado, setIntentado] = useState(false)
  const [errorServidor, setErrorServidor] = useState(null)
  const [success, setSuccess] = useState(null)

  const hoy = hoyISO()

  // ---------- Cliente ----------
  const buscarCliente = async () => {
    if (!clienteQuery.trim()) return
    setLoadingCliente(true)
    try {
      setClienteResults((await clientesApi.buscar(clienteQuery.trim())).slice(0, 6))
    } catch {
      setClienteResults([])
    } finally {
      setLoadingCliente(false)
    }
  }

  const seleccionarCliente = (c) => {
    setCliente(c)
    setClienteQuery('')
    setClienteResults(null)
    setNuevoCliente(null)
  }

  // CUS-02 FA-2: Cliente no registrado
  const guardarNuevoCliente = async () => {
    if (!nuevoCliente.nombre.trim() || !nuevoCliente.telefono.trim()) {
      setNuevoCliente(prev => ({ ...prev, error: 'El nombre y el teléfono son obligatorios.' }))
      return
    }
    try {
      const creado = await clientesApi.crear({
        nombre: nuevoCliente.nombre,
        telefono: nuevoCliente.telefono,
        direccion: nuevoCliente.direccion,
        canalContacto: nuevoCliente.canalContacto,
      })
      seleccionarCliente(creado)
      pushToast('success', `Cliente ${creado.nombre} registrado.`)
    } catch (err) {
      setNuevoCliente(prev => ({ ...prev, error: err.message }))
    }
  }

  // ---------- Productos ----------
  const buscarProducto = async () => {
    setLoadingProducto(true)
    try {
      const q = productoQuery.trim()
      const res = q ? await productosApi.buscar(q) : await productosApi.listarTodos()
      setProductoResults(res.slice(0, 8))
    } catch {
      setProductoResults([])
    } finally {
      setLoadingProducto(false)
    }
  }

  const agregarProducto = (p) => {
    setItems(prev => {
      const existe = prev.find(i => i.producto.id === p.id)
      if (existe) {
        return prev.map(i => i.producto.id === p.id ? { ...i, cantidad: Number(i.cantidad || 0) + 1 } : i)
      }
      return [...prev, { producto: p, cantidad: 1 }]
    })
    setProductoResults(null)
    setProductoQuery('')
  }

  const cambiarCantidad = (id, valor) =>
    setItems(prev => prev.map(i => i.producto.id === id ? { ...i, cantidad: valor } : i))

  const quitarProducto = (id) => setItems(prev => prev.filter(i => i.producto.id !== id))

  // RN-012 (CUS-02 FA-1): la cantidad no puede superar las unidades disponibles
  const errorDeItem = (item) => {
    const cantidad = Number(item.cantidad)
    if (!item.cantidad || !Number.isInteger(cantidad) || cantidad <= 0) return 'La cantidad debe ser un número entero mayor a 0.'
    if (item.producto.estadoProducto !== 'DISPONIBLE' || item.producto.unidadesDisponibles === 0) return 'Producto agotado.'
    if (cantidad > item.producto.unidadesDisponibles) {
      return `Solo hay ${item.producto.unidadesDisponibles} unidad(es) disponible(s).`
    }
    return null
  }

  // ---------- Totales (paso 8, REQ007). El servidor vuelve a calcular el total. ----------
  const subtotal = useMemo(
    () => items.reduce((suma, i) => suma + Number(i.producto.valor) * (Number(i.cantidad) || 0), 0),
    [items]
  )
  const costoDomicilio = tipoEntrega === 'DOMICILIO_ARMENIA' ? COSTO_DOMICILIO_ARMENIA : 0   // RN-010
  const valorTotal = subtotal + costoDomicilio

  // ---------- Validaciones antes de confirmar ----------
  const errores = useMemo(() => {
    const lista = []
    if (!cliente) lista.push({ code: 'CUS-02', msg: 'Busca o selecciona un cliente para continuar.' })
    else if (cliente.estadoCliente === 'INACTIVO') lista.push({ code: 'CUS-02', msg: 'El cliente está inactivo y no puede registrar pedidos.' })
    if (items.length === 0) lista.push({ code: 'CUS-02 FA-3', msg: 'Agrega al menos un producto al pedido.' })
    if (items.some(i => errorDeItem(i))) lista.push({ code: 'RN-012', msg: 'Corrige las cantidades de los productos marcados.' })
    if (!fechaLimitePago) lista.push({ code: 'RN-013', msg: 'Indica el plazo de pago acordado con el cliente.' })
    else if (fechaLimitePago < hoy) lista.push({ code: 'RN-013', msg: 'El plazo de pago no puede ser una fecha pasada.' })
    return lista
  }, [cliente, items, fechaLimitePago, hoy])

  const confirmarPedido = async () => {
    setIntentado(true)
    setErrorServidor(null)
    if (errores.length > 0) return
    setSubmitting(true)
    try {
      const pedido = await pedidosApi.crear({
        clienteId: cliente.id,
        items: items.map(i => ({ productoId: i.producto.id, cantidad: Number(i.cantidad) })),
        fechaLimitePago,
        tipoEntrega,
      })
      setSuccess(pedido)
      pushToast('success', `Pedido ${formatPedidoId(pedido.id)} registrado.`)
    } catch (err) {
      setErrorServidor({ code: err.regla, msg: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  // CUS-02 FA-4: Cancelación — descarta los datos, no registra nada
  const reset = () => {
    setCliente(null); setClienteQuery(''); setClienteResults(null); setNuevoCliente(null)
    setItems([]); setProductoQuery(''); setProductoResults(null)
    setTipoEntrega('TIENDA'); setFechaLimitePago('')
    setIntentado(false); setErrorServidor(null); setSuccess(null)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="crumb">
            <IconHome size={11} /> Operación <IconChev size={11} /> Pedidos <IconChev size={11} /> Nuevo
          </div>
          <h1 className="page-title">Registrar pedido</h1>
          <p className="page-sub">
            Completa los tres pasos para registrar un pedido en estado{' '}
            <b style={{ color: '#b8860b' }}>PENDIENTE DE PAGO</b>. <span className="trace">CUS-02</span>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={reset}>Cancelar</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 20 }}>
        <div className="card">

          {/* ===== Sección 1: Cliente ===== */}
          <Section step="1" title="Cliente" desc="Busca al cliente por nombre o teléfono, o regístralo si es nuevo.">
            {!cliente && !nuevoCliente && (
              <div className="search-wrap">
                <div className="search-row">
                  <input className="input" placeholder="Nombre o teléfono…"
                         value={clienteQuery}
                         onChange={e => setClienteQuery(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && buscarCliente()}
                         aria-label="Buscar cliente" />
                  <button className="btn btn-primary" onClick={buscarCliente} disabled={loadingCliente}>
                    {loadingCliente ? <IconLoad size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Buscar'}
                  </button>
                  <button className="btn btn-secondary"
                          onClick={() => setNuevoCliente({ nombre: '', telefono: '', direccion: '', canalContacto: 'WhatsApp', error: '' })}>
                    <IconPlus size={13} /> Cliente nuevo
                  </button>
                </div>
                {clienteResults && (
                  <div className="search-results">
                    {clienteResults.length === 0
                      ? <div className="sr-empty">Sin resultados para "{clienteQuery}". Puedes registrarlo con «Cliente nuevo».</div>
                      : clienteResults.map(c => (
                        <div key={c.id} className="sr-item" onClick={() => seleccionarCliente(c)}>
                          <div className="sr-mini">{iniciales(c.nombre)}</div>
                          <div className="sr-text">
                            <div className="sr-name">{c.nombre}</div>
                            <div className="sr-sub">{c.telefono} · {c.direccion}</div>
                          </div>
                          <Badge estado={c.estadoCliente} />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Flujo alterno 2: Cliente no registrado */}
            {nuevoCliente && (
              <div className="entity-card" style={{ display: 'block' }}>
                <div style={{ fontWeight: 600, marginBottom: 10 }}>
                  Registrar cliente nuevo <span className="trace">CUS-02 FA-2</span>
                </div>
                <div className="grid-2">
                  <FormField label="Nombre" required>
                    <input className="input" value={nuevoCliente.nombre} placeholder="Ej: Andrea Muñoz"
                           onChange={e => setNuevoCliente(p => ({ ...p, nombre: e.target.value }))} />
                  </FormField>
                  <FormField label="Teléfono" required>
                    <input className="input" value={nuevoCliente.telefono} placeholder="Ej: 3104567890"
                           onChange={e => setNuevoCliente(p => ({ ...p, telefono: e.target.value }))} />
                  </FormField>
                  <FormField label="Dirección">
                    <input className="input" value={nuevoCliente.direccion} placeholder="Ej: Cra 14 # 5-20, Armenia"
                           onChange={e => setNuevoCliente(p => ({ ...p, direccion: e.target.value }))} />
                  </FormField>
                  <FormField label="Canal de contacto">
                    <select className="input" value={nuevoCliente.canalContacto}
                            onChange={e => setNuevoCliente(p => ({ ...p, canalContacto: e.target.value }))}>
                      {['WhatsApp', 'Instagram', 'Facebook', 'Tienda física'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </FormField>
                </div>
                {nuevoCliente.error && <InlineMsg kind="error" code="CUS-02 FA-2">{nuevoCliente.error}</InlineMsg>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="btn btn-ghost" onClick={() => setNuevoCliente(null)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={guardarNuevoCliente}><IconCheck size={13} /> Guardar cliente</button>
                </div>
              </div>
            )}

            {cliente && (
              <div className="entity-card">
                <div className="entity-avatar">{iniciales(cliente.nombre)}</div>
                <div className="entity-main">
                  <div className="entity-name">{cliente.nombre} <Badge estado={cliente.estadoCliente} /></div>
                  <div className="entity-meta">
                    <span>{cliente.telefono}</span><span className="sep">·</span>
                    <span>{cliente.direccion || 'Sin dirección'}</span><span className="sep">·</span>
                    <span>{cliente.canalContacto}</span>
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => setCliente(null)}>Cambiar</button>
              </div>
            )}

            {!cliente && !nuevoCliente && !clienteResults && (
              <EmptyHint icon={<IconUser size={20} />} text="Busca o selecciona un cliente para continuar." />
            )}
            {cliente && cliente.estadoCliente === 'INACTIVO' && (
              <InlineMsg kind="error" code="CUS-02">El cliente está inactivo y no puede registrar pedidos.</InlineMsg>
            )}
          </Section>

          {/* ===== Sección 2: Productos del pedido ===== */}
          <Section step="2" title="Productos" desc="Agrega los productos con su cantidad. Se verifica la disponibilidad de cada uno.">
            <div className="search-wrap">
              <div className="search-row">
                <input className="input" placeholder="Tipo, talla o color… (vacío muestra el catálogo)"
                       value={productoQuery}
                       onChange={e => setProductoQuery(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && buscarProducto()}
                       aria-label="Buscar producto" />
                <button className="btn btn-primary" onClick={buscarProducto} disabled={loadingProducto}>
                  {loadingProducto ? <IconLoad size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Buscar'}
                </button>
              </div>
              {productoResults && (
                <div className="search-results">
                  {productoResults.length === 0
                    ? <div className="sr-empty">Sin productos para "{productoQuery}"</div>
                    : productoResults.map(p => {
                      const agotado = p.estadoProducto !== 'DISPONIBLE' || p.unidadesDisponibles === 0
                      return (
                        <div key={p.id} className="sr-item"
                             style={agotado ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
                             onClick={() => !agotado && agregarProducto(p)}>
                          <div className="sr-mini exp">🍒</div>
                          <div className="sr-text">
                            <div className="sr-name">{nombreProducto(p)}</div>
                            <div className="sr-sub">{fmtCOP(p.valor)} · {p.unidadesDisponibles} disponibles</div>
                          </div>
                          <Badge estado={agotado ? 'AGOTADO' : 'DISPONIBLE'} />
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <EmptyHint icon={<IconBag size={20} />} text="Aún no hay productos en el pedido. Agrega el primero." />
            ) : (
              <div className="items-table">
                <table className="table">
                  <thead>
                    <tr><th>Producto</th><th>Talla / Color</th><th>Cantidad</th><th>Valor</th><th>Subtotal</th><th></th></tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const error = errorDeItem(item)
                      return (
                        <React.Fragment key={item.producto.id}>
                          <tr>
                            <td style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{item.producto.tipo}</td>
                            <td>{[item.producto.talla, item.producto.color].filter(Boolean).join(' / ') || '—'}</td>
                            <td>
                              <input type="number" min="1" className={'input qty-input ' + (error ? 'is-error' : '')}
                                     value={item.cantidad}
                                     onChange={e => cambiarCantidad(item.producto.id, e.target.value)}
                                     aria-label={'Cantidad de ' + nombreProducto(item.producto)} />
                            </td>
                            <td>{fmtCOP(item.producto.valor)}</td>
                            <td>{fmtCOP(Number(item.producto.valor) * (Number(item.cantidad) || 0))}</td>
                            <td>
                              <button className="btn-icon" title="Quitar" onClick={() => quitarProducto(item.producto.id)}>
                                <IconX size={13} />
                              </button>
                            </td>
                          </tr>
                          {error && (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'left', paddingTop: 0 }}>
                                <div className="row-error" role="alert">
                                  <span className="trace" style={{ color: 'var(--danger)' }}>RN-012</span> {error}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* ===== Sección 3: Entrega y pago ===== */}
          <Section step="3" title="Entrega y pago" desc="Define la entrega y el plazo de pago acordado con el cliente.">
            <div className="grid-2">
              <FormField label="Tipo de entrega" required
                         hint="El domicilio en Armenia tiene un costo fijo de $5.000 (RN-010).">
                <select className="input" value={tipoEntrega} onChange={e => setTipoEntrega(e.target.value)}>
                  {TIPOS_ENTREGA.map(t => <option key={t.valor} value={t.valor}>{t.texto}</option>)}
                </select>
              </FormField>
              <FormField label="Plazo de pago" required
                         hint="Si no se paga en el plazo, el pedido se cancela y los productos vuelven a estar disponibles (RN-013)."
                         error={fechaLimitePago && fechaLimitePago < hoy ? 'El plazo de pago no puede ser una fecha pasada.' : null}>
                <input type="date" min={hoy}
                       className={'input ' + (fechaLimitePago && fechaLimitePago < hoy ? 'is-error' : '')}
                       value={fechaLimitePago} onChange={e => setFechaLimitePago(e.target.value)} />
              </FormField>
            </div>

            <div className="field">
              <label>Valor total</label>
              <div className="amount-display">
                <div>
                  <div className="lbl">Total a pagar</div>
                  <span className="calc">
                    {fmtCOP(subtotal)} productos{costoDomicilio > 0 && <> + {fmtCOP(costoDomicilio)} domicilio</>}
                  </span>
                </div>
                <span>{fmtCOP(valorTotal)}</span>
              </div>
            </div>

            <div className="field">
              <label>Medios de pago que se informan al cliente <span className="trace">RN-001</span></label>
              <div className="pay-chips">
                {MEDIOS_PAGO.map(m => <span key={m} className="pay-chip">{m}</span>)}
              </div>
            </div>

            {intentado && errores.map(err => (
              <InlineMsg key={err.code + err.msg} kind="error" code={err.code}>{err.msg}</InlineMsg>
            ))}
            {errorServidor && <InlineMsg kind="error" code={errorServidor.code}>{errorServidor.msg}</InlineMsg>}
          </Section>

          <div className="card-foot">
            <div style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
              <IconInfo size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              Estado al confirmar: <Badge estado="PENDIENTE_DE_PAGO" />
            </div>
            <button className="btn btn-primary btn-lg" disabled={submitting} onClick={confirmarPedido}>
              {submitting
                ? <><IconLoad size={14} style={{ animation: 'spin 1s linear infinite' }} /> Procesando…</>
                : <><IconCheck size={14} /> Confirmar pedido</>}
            </button>
          </div>
        </div>

        {/* ===== Resumen lateral ===== */}
        <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 24 }}>
          <div className="card-head" style={{ padding: '16px 20px' }}>
            <h3 className="card-title" style={{ fontSize: 14 }}>Resumen del pedido</h3>
            <IconReceipt size={14} style={{ color: 'var(--ink-400)' }} />
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SumLine k="Cliente" v={cliente ? cliente.nombre : '—'} sub={cliente ? cliente.telefono : null} />
            <SumLine k="Productos"
                     v={items.length ? `${items.reduce((s, i) => s + (Number(i.cantidad) || 0), 0)} unidad(es)` : '—'}
                     sub={items.length ? items.map(i => nombreProducto(i.producto)).join(', ') : null} />
            <SumLine k="Entrega" v={TIPOS_ENTREGA.find(t => t.valor === tipoEntrega).texto} />
            <SumLine k="Plazo de pago" v={fechaLimitePago ? fmtFechaCorta(fechaLimitePago) : '—'} />
            <div style={{ height: 1, background: 'var(--ink-200)' }} />
            <div className="receipt-total">
              <span className="k">Total</span>
              <span className="v">{fmtCOP(valorTotal)}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-400)', lineHeight: 1.4 }}>
              <IconInfo size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              Al confirmar se reservan las unidades en el inventario.
            </div>
          </div>
        </div>
      </div>

      {success && <PedidoRegistradoModal pedido={success} onClose={reset} />}
    </>
  )
}

// ---- Subcomponentes ----

function Section({ step, title, desc, children }) {
  return (
    <div className="form-section">
      <div className="fs-label">
        <div className="step">{step}</div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
      <div className="fs-body">{children}</div>
    </div>
  )
}

function EmptyHint({ icon, text }) {
  return (
    <div className="empty-state">
      {icon}
      <div style={{ marginTop: 6 }}>{text}</div>
    </div>
  )
}

function SumLine({ k, v, sub }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 3 }}>{k}</div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-900)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{v}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

// Paso 14 del flujo básico: confirmación del pedido registrado
function PedidoRegistradoModal({ pedido, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-check"><IconCheck size={22} /></div>
          <div className="eyebrow">Pedido registrado</div>
          <h2>{formatPedidoId(pedido.id)}</h2>
        </div>
        <div className="modal-body">
          <div className="receipt-row"><span className="k">Cliente</span><span className="v">{pedido.cliente.nombre}</span></div>
          {pedido.detalles.map(d => (
            <div className="receipt-row" key={d.producto.id}>
              <span className="k">{d.cantidad} × {nombreProducto(d.producto)}</span>
              <span className="v">{fmtCOP(d.subtotal)}</span>
            </div>
          ))}
          <div className="receipt-row"><span className="k">Costo del domicilio</span><span className="v">{fmtCOP(pedido.costoDomicilio)}</span></div>
          <div className="receipt-row"><span className="k">Plazo de pago</span><span className="v">{fmtFechaCorta(pedido.fechaLimitePago)}</span></div>
          <div className="receipt-row"><span className="k">Estado</span><span className="v"><Badge estado={pedido.estadoPedido} /></span></div>
          <div className="receipt-total" style={{ marginTop: 14 }}>
            <span className="k">Total</span>
            <span className="v">{fmtCOP(pedido.valorTotal)}</span>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          <button className="btn btn-primary" onClick={onClose}><IconPlus size={14} /> Nuevo pedido</button>
        </div>
      </div>
    </div>
  )
}
