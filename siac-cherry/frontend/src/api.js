// ============================================================
// api.js — capa de acceso al backend Spring Boot (SIAC Cherry)
// ============================================================
// El proxy de Vite (vite.config.js) reescribe /api → http://localhost:8080/api
// Cada función indica el endpoint que usa, para la matriz de trazabilidad.

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ mensaje: 'Error del servidor' }))
    const error = new Error(err.mensaje || 'Error del servidor')
    error.regla = err.regla || ''   // código de la regla o flujo alterno incumplido
    throw error
  }
  if (res.status === 204) return null
  return res.json()
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }
const post = (data) => ({ method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(data) })
const put  = (data) => ({ method: 'PUT',  headers: JSON_HEADERS, body: JSON.stringify(data) })

export const clientesApi = {
  buscar: (q)    => apiFetch(`/api/clientes?query=${encodeURIComponent(q)}`),   // GET  /api/clientes?query=
  crear:  (data) => apiFetch('/api/clientes', post(data)),                      // POST /api/clientes (CUS-02 FA-2)
}

export const productosApi = {
  listarTodos: ()         => apiFetch('/api/productos'),                                  // GET    /api/productos
  buscar:      (q)        => apiFetch(`/api/productos?query=${encodeURIComponent(q)}`),   // GET    /api/productos?query=
  crear:       (data)     => apiFetch('/api/productos', post(data)),                      // POST   /api/productos
  actualizar:  (id, data) => apiFetch(`/api/productos/${id}`, put(data)),                 // PUT    /api/productos/{id}
  eliminar:    (id)       => apiFetch(`/api/productos/${id}`, { method: 'DELETE' }),      // DELETE /api/productos/{id}
}

export const pedidosApi = {
  crear:    (data) => apiFetch('/api/pedidos', post(data)),                          // POST  /api/pedidos (CUS-02)
  todos:    ()     => apiFetch('/api/pedidos'),                                      // GET   /api/pedidos
  cancelar: (id)   => apiFetch(`/api/pedidos/${id}/cancelar`, { method: 'PATCH' }),  // PATCH /api/pedidos/{id}/cancelar (FA-6)
}

// ---- Helpers de formato ----

export const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)

export const fmtFechaCorta = (isoStr) =>
  new Date(isoStr + 'T00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

// Fecha de hoy en formato yyyy-mm-dd (hora local)
export const hoyISO = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const iniciales = (nombre) =>
  (nombre || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

export const nombreProducto = (p) => [p.tipo, p.talla, p.color].filter(Boolean).join(' ')

export const formatPedidoId = (id) => 'PED-' + String(id).padStart(6, '0')

// RN-001: medios de pago que acepta Cherry
export const MEDIOS_PAGO = ['Efectivo', 'Transferencia', 'Daviplata', 'Nequi', 'Llave', 'Sistecredito']

// RN-010: costo fijo del domicilio en Armenia
export const COSTO_DOMICILIO_ARMENIA = 5000

export const TIPOS_ENTREGA = [
  { valor: 'TIENDA',            texto: 'Recoge en tienda' },
  { valor: 'DOMICILIO_ARMENIA', texto: 'Domicilio en Armenia (+$5.000)' },
  { valor: 'ENVIO_NACIONAL',    texto: 'Envío nacional' },
]
