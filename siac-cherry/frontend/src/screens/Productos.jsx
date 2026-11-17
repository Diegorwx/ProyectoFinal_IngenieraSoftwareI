import React, { useState, useEffect, useMemo } from 'react'
import { productosApi, fmtCOP, nombreProducto } from '../api.js'
import { Badge, InlineMsg, FormField } from '../components.jsx'
import {
  IconHome, IconChev, IconSearch, IconPlus, IconEdit, IconCheck, IconLoad, IconX, IconAlert,
  IconChevL, IconTrash, IconBox
} from '../icons.jsx'

const PAGE_SIZE = 10

// ============================================================
// Pantalla 2 — CRUD de Producto
// Los nombres de los campos son los atributos de la clase Producto.
// ============================================================
export default function Productos({ pushToast }) {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState('TODOS')
  const [page, setPage] = useState(1)
  const [drawer, setDrawer] = useState(null)
  const [porEliminar, setPorEliminar] = useState(null)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      setProductos(await productosApi.listarTodos())   // GET /api/productos
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => ({
    total: productos.length,
    disponibles: productos.filter(p => p.estadoProducto === 'DISPONIBLE').length,
    agotados: productos.filter(p => p.estadoProducto === 'AGOTADO').length,
    unidades: productos.reduce((s, p) => s + p.unidadesDisponibles, 0),
  }), [productos])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return productos.filter(p => {
      if (filterEstado !== 'TODOS' && p.estadoProducto !== filterEstado) return false
      if (!q) return true
      return nombreProducto(p).toLowerCase().includes(q)
    })
  }, [productos, query, filterEstado])

  useEffect(() => { setPage(1) }, [query, filterEstado])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ---- Crear / Editar ----
  const handleSave = async (form, mode) => {
    const datos = {
      tipo: form.tipo.trim(),
      talla: form.talla.trim(),
      color: form.color.trim(),
      valor: Number(form.valor),
      unidadesDisponibles: Number(form.unidadesDisponibles),
      estadoProducto: form.estadoProducto,
    }
    if (mode === 'create') {
      const nuevo = await productosApi.crear(datos)                 // POST /api/productos
      setProductos(prev => [...prev, nuevo])
      pushToast('success', `Producto ${nombreProducto(nuevo)} creado.`)
    } else {
      const actualizado = await productosApi.actualizar(form.id, datos)   // PUT /api/productos/{id}
      setProductos(prev => prev.map(p => p.id === form.id ? actualizado : p))
      pushToast('success', `Producto ${nombreProducto(actualizado)} actualizado.`)
    }
    setDrawer(null)
  }

  // ---- Eliminar ----
  const handleDelete = async (producto) => {
    try {
      await productosApi.eliminar(producto.id)                      // DELETE /api/productos/{id}
      setProductos(prev => prev.filter(p => p.id !== producto.id))
      pushToast('success', `Producto ${nombreProducto(producto)} eliminado.`)
    } catch (err) {
      pushToast('error', err.message)
    } finally {
      setPorEliminar(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-400)' }}>
        <IconLoad size={28} style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: 12 }}>Cargando productos…</div>
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
          <div className="crumb"><IconHome size={11} /> Operación <IconChev size={11} /> Productos</div>
          <h1 className="page-title">Gestión de productos</h1>
          <p className="page-sub">
            Catálogo e inventario de Cherry. Un producto sin unidades queda como agotado y no se puede pedir.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setDrawer({ mode: 'create' })}>
          <IconPlus size={14} /> Nuevo producto
        </button>
      </div>

      <div className="stat-strip">
        <StatCard label="Total productos" value={stats.total} icon={<IconBox size={14} />} />
        <StatCard label="Disponibles" value={stats.disponibles} icon={<IconCheck size={14} />} />
        <StatCard label="Agotados" value={stats.agotados} icon={<IconAlert size={14} />} />
        <StatCard label="Unidades en inventario" value={stats.unidades} icon={<IconBox size={14} />} />
      </div>

      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 14 }}>
          <div className="toolbar">
            <div className="search-box">
              <IconSearch size={15} />
              <input className="input" placeholder="Buscar por tipo, talla o color…"
                     value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar producto" />
            </div>
            {['TODOS', 'DISPONIBLE', 'AGOTADO'].map(est => (
              <button key={est}
                      className={'filter-chip ' + (filterEstado === est ? 'is-active' : '')}
                      onClick={() => setFilterEstado(est)}>
                {est === 'DISPONIBLE' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />}
                {est === 'AGOTADO' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} />}
                {est === 'TODOS' ? 'Todos' : est === 'DISPONIBLE' ? 'Disponibles' : 'Agotados'}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          {paged.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <IconSearch size={28} style={{ color: 'var(--ink-300)' }} />
              <div style={{ marginTop: 12, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink-700)' }}>
                {productos.length === 0 ? 'No hay productos registrados' : 'Sin resultados'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 4 }}>
                {productos.length === 0
                  ? 'Crea el primero con «Nuevo producto».'
                  : 'No encontramos productos con esos criterios. Prueba con otro término.'}
              </div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th><th>Tipo</th><th>Talla</th><th>Color</th><th>Valor</th>
                  <th>Unidades disponibles</th><th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(p => (
                  <tr key={p.id} className={p.estadoProducto === 'AGOTADO' ? 'is-inactive' : ''}>
                    <td className="cell-doc">{p.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{p.tipo}</td>
                    <td>{p.talla || '—'}</td>
                    <td>{p.color || '—'}</td>
                    <td>{fmtCOP(p.valor)}</td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 600,
                        color: p.unidadesDisponibles === 0 ? 'var(--danger)' : 'var(--ink-900)'
                      }}>{p.unidadesDisponibles}</span>
                    </td>
                    <td><Badge estado={p.estadoProducto} /></td>
                    <td className="cell-actions">
                      <div className="cell-actions">
                        <button className="btn-icon" title="Editar" onClick={() => setDrawer({ mode: 'edit', producto: p })}>
                          <IconEdit size={14} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12.5 }}
                                onClick={() => setPorEliminar(p)}>
                          <IconTrash size={12} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card-foot">
          <div className="pg-info">
            Mostrando <b>{paged.length}</b> de <b>{filtered.length}</b> {filtered.length === 1 ? 'producto' : 'productos'}
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

      {drawer && (
        <ProductoFormDrawer mode={drawer.mode} producto={drawer.producto}
                            onClose={() => setDrawer(null)} onSave={handleSave} />
      )}
      {porEliminar && (
        <ConfirmarEliminacion producto={porEliminar}
                              onCancel={() => setPorEliminar(null)}
                              onConfirm={() => handleDelete(porEliminar)} />
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

function ProductoFormDrawer({ mode, producto, onClose, onSave }) {
  const [form, setForm] = useState(() => producto
    ? { ...producto, talla: producto.talla || '', color: producto.color || '',
        valor: String(producto.valor), unidadesDisponibles: String(producto.unidadesDisponibles) }
    : { tipo: '', talla: '', color: '', valor: '', unidadesDisponibles: '', estadoProducto: 'DISPONIBLE' })
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState(null)

  // Validaciones en la pantalla (el servidor las repite)
  const validar = (f) => {
    const e = {}
    if (!f.tipo.trim()) e.tipo = 'Campo obligatorio.'
    if (f.valor === '') e.valor = 'Campo obligatorio.'
    else if (!(Number(f.valor) > 0)) e.valor = 'El valor debe ser mayor a 0.'
    if (f.unidadesDisponibles === '') e.unidadesDisponibles = 'Campo obligatorio.'
    else if (!Number.isInteger(Number(f.unidadesDisponibles)) || Number(f.unidadesDisponibles) < 0)
      e.unidadesDisponibles = 'Debe ser un número entero mayor o igual a 0.'
    return e
  }
  const todos = validar(form)
  const errors = Object.fromEntries(Object.entries(todos).filter(([k]) => touched[k]))

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const blur = (k) => setTouched(prev => ({ ...prev, [k]: true }))

  const submit = async () => {
    setTouched({ tipo: true, valor: true, unidadesDisponibles: true })
    if (Object.keys(todos).length > 0) return
    setSaving(true)
    setApiError(null)
    try {
      await onSave(form, mode)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true"
           aria-label={mode === 'create' ? 'Nuevo producto' : 'Editar producto'}>
        <div className="drawer-head">
          <div>
            <h2>{mode === 'create' ? 'Nuevo producto' : 'Editar producto'}</h2>
            <div className="sub">
              {mode === 'create' ? 'Registra un producto en el catálogo.' : `Modificar datos de ${nombreProducto(producto)}.`}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar"><IconX size={14} /></button>
        </div>

        <div className="drawer-body">
          {mode === 'edit' && (
            <FormField label="Id" hint="El id se genera automáticamente y no puede modificarse.">
              <input className="input" value={form.id} disabled />
            </FormField>
          )}
          <FormField label="Tipo" required error={errors.tipo}>
            <input className={'input ' + (errors.tipo ? 'is-error' : '')} placeholder="Ej: Blusa"
                   value={form.tipo} onChange={e => set('tipo', e.target.value)} onBlur={() => blur('tipo')} />
          </FormField>
          <div className="grid-2">
            <FormField label="Talla">
              <input className="input" placeholder="Ej: M" value={form.talla} onChange={e => set('talla', e.target.value)} />
            </FormField>
            <FormField label="Color">
              <input className="input" placeholder="Ej: Rojo" value={form.color} onChange={e => set('color', e.target.value)} />
            </FormField>
          </div>
          <div className="grid-2">
            <FormField label="Valor" required error={errors.valor}>
              <input type="number" className={'input ' + (errors.valor ? 'is-error' : '')} placeholder="Ej: 45000"
                     value={form.valor} onChange={e => set('valor', e.target.value)} onBlur={() => blur('valor')} />
            </FormField>
            <FormField label="Unidades disponibles" required error={errors.unidadesDisponibles}>
              <input type="number" className={'input ' + (errors.unidadesDisponibles ? 'is-error' : '')} placeholder="Ej: 5"
                     value={form.unidadesDisponibles}
                     onChange={e => set('unidadesDisponibles', e.target.value)} onBlur={() => blur('unidadesDisponibles')} />
            </FormField>
          </div>
          <FormField label="Estado" required hint="Si las unidades son 0, el producto queda agotado automáticamente.">
            <div className="radio-group">
              <label className={'radio-card ' + (form.estadoProducto === 'DISPONIBLE' ? 'is-on' : '')}>
                <input type="radio" name="estadoProducto" hidden checked={form.estadoProducto === 'DISPONIBLE'}
                       onChange={() => set('estadoProducto', 'DISPONIBLE')} />
                <span className="radio-dot" /><span className="lbl">Disponible</span>
              </label>
              <label className={'radio-card ' + (form.estadoProducto === 'AGOTADO' ? 'is-on is-off' : '')}>
                <input type="radio" name="estadoProducto" hidden checked={form.estadoProducto === 'AGOTADO'}
                       onChange={() => set('estadoProducto', 'AGOTADO')} />
                <span className="radio-dot" /><span className="lbl">Agotado</span>
              </label>
            </div>
          </FormField>
          {apiError && <InlineMsg kind="error">{apiError}</InlineMsg>}
        </div>

        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving
              ? <><IconLoad size={14} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</>
              : <><IconCheck size={14} /> Guardar</>}
          </button>
        </div>
      </div>
    </>
  )
}

function ConfirmarEliminacion({ producto, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 24px 18px' }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: 'var(--danger-bg)', color: 'var(--danger)',
            display: 'grid', placeItems: 'center', marginBottom: 14,
          }}>
            <IconTrash size={18} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            ¿Eliminar producto?
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-500)', lineHeight: 1.5 }}>
            <strong>{nombreProducto(producto)}</strong> se eliminará del catálogo. No se puede eliminar un producto
            que esté en pedidos activos.
          </p>
        </div>
        <div className="modal-foot" style={{ borderTop: '1px solid var(--ink-200)', background: 'var(--ink-50)' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger"
                  style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}
                  onClick={onConfirm}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
