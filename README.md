# SIAC Cherry

Sistema Integral de Atención al Cliente de **Cherry** (ropa, bolsos, accesorios, productos capilares y maquillaje).
Proyecto académico — Ingeniería de Software I, Universidad del Quindío.

MVP con dos pantallas: la transacción **Registrar pedido** (CUS-02) y el **CRUD de Producto**.

Incluye además dos paneles de consulta, **Pedidos** y **Clientes**, que son *extras fuera del alcance del MVP* (ver la sección «Extras»).


## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Java 21 + Spring Boot 4.0.6 |
| Frontend | React 18 + Vite (JavaScript) |
| Persistencia | HashMap en memoria (los datos se reinician al reiniciar el backend) |
| Dependencias extra | Lombok |

## Cómo ejecutar

**1. Backend** (queda en `http://localhost:8080`)

```bash
.\mvnw.cmd spring-boot:run      # Windows
./mvnw spring-boot:run          # Linux / macOS
```

**2. Frontend** (queda en `http://localhost:5173`)

```bash
cd frontend
npm install
npm run dev
```

**3. Pruebas**

```bash
.\mvnw.cmd test
```

## Datos de prueba

Se cargan solos al arrancar (`config/DataSeeder.java`): 10 clientes, 20 productos y 8 pedidos en todos los estados (pendientes de pago, pagados, entregados y cancelados). Los pedidos pagados y entregados son solo datos de prueba: el MVP no tiene pantallas para registrar pagos ni entregas.

| Para probar | Usa |
|---|---|
| Flujo básico | Cliente **Andrea Muñoz** + **Jean 8 Azul** (6 unidades) |
| Stock insuficiente (RN-012) | **Blusa L Negro** (solo 1 unidad): pide 2 |
| Producto agotado (RN-012) | **Vestido S Rosado** o **Tratamiento capilar** (0 unidades) |
| Cliente inactivo | **Paula Henao** o **Natalia Quintero** |
| Eliminar bloqueado | **Blusa M Rojo** o **Bolso Negro** (están en un pedido pendiente) |
| Historial de compras | **Andrea Muñoz** (2 pedidos) en el panel Clientes |
| Cancelar pedido | **PED-000001** o **PED-000007** (pendientes) en el panel Pedidos |

No hay inicio de sesión: la aplicación abre con el rol *Encargada de Redes / Asesora de Tienda*.

## Estructura

```
siac-cherry/
├── src/main/java/com/cherry/siac/
│   ├── modelo/          # Cliente, Producto, Pedido, DetallePedido (Diagrama de Clases)
│   ├── dto/             # PedidoRequest, ItemPedidoRequest
│   ├── repositorio/     # Datos en memoria
│   ├── servicio/        # Reglas de negocio y validaciones
│   ├── controlador/     # Endpoints REST
│   └── config/          # CORS, datos de prueba, manejo de errores
├── src/test/java/…/PedidoServicioTest.java   # Casos de aceptación
└── frontend/src/
    ├── screens/         # RegistrarPedido.jsx, Productos.jsx, Pedidos.jsx, Clientes.jsx
    ├── api.js           # Llamadas al backend
    └── components.jsx   # Badge, InlineMsg, FormField
```

## API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/clientes?query=texto` | Busca clientes por nombre o teléfono |
| POST | `/api/clientes` | Registra un cliente nuevo |
| GET | `/api/productos?query=texto` | Lista o busca productos por tipo, talla o color |
| GET | `/api/productos/{id}` | Consulta un producto y sus unidades disponibles |
| POST | `/api/productos` | Crea un producto |
| PUT | `/api/productos/{id}` | Actualiza un producto |
| DELETE | `/api/productos/{id}` | Elimina un producto (si no está en pedidos activos) |
| GET | `/api/pedidos?clienteId=1` | Lista los pedidos (todos o de un cliente) |
| POST | `/api/pedidos` | Registra un pedido: valida las reglas, calcula el total y reserva el inventario |
| PATCH | `/api/pedidos/{id}/cancelar` | Cancela un pedido pendiente y libera el inventario |

**Cuerpo para registrar un pedido:**

```json
{
  "clienteId": 1,
  "items": [ { "productoId": 4, "cantidad": 2 }, { "productoId": 12, "cantidad": 1 } ],
  "fechaLimitePago": "2026-12-01",
  "tipoEntrega": "DOMICILIO_ARMENIA"
}
```

**Respuesta de error** (incluye la regla o el flujo alterno incumplido):

```json
{ "regla": "RN-012", "mensaje": "Solo hay 1 unidad(es) disponible(s) de 'Blusa L Negro'." }
```

## Extras (fuera del alcance del MVP)

Dos paneles de solo consulta que no forman parte de la rúbrica ni de la matriz de trazabilidad:

| Panel | Qué muestra | Endpoints que usa |
|---|---|---|
| **Pedidos** (`Pedidos.jsx`) | Contadores por estado, tabla con filtros y buscador, detalle de cada pedido. Permite cancelar un pedido pendiente (CUS-02 FA-6) y avisa cuando el plazo de pago venció (RN-013). | `GET /api/pedidos`, `PATCH /api/pedidos/{id}/cancelar` |
| **Clientes** (`Clientes.jsx`) | Datos de contacto, número de compras y total comprado por cliente, e historial de pedidos de cada uno. Los pedidos cancelados no cuentan como compras. | `GET /api/clientes`, `GET /api/pedidos`, `GET /api/pedidos?clienteId=` |

El ícono de la aplicación (`frontend/public/favicon.png`) se tomó del logo de Cherry by Verónica.

## Reglas que afectan la transacción

| Regla | Descripción | Dónde se valida |
|-------|-------------|-----------------|
| RN-001 | Cherry acepta efectivo, transferencia, Daviplata, Nequi, Llave y Sistecredito | Pantalla 1 (se informa al cliente) |
| RN-010 | El domicilio en Armenia cuesta $5.000 | `PedidoServicio` y Pantalla 1 |
| RN-012 | No se registra un producto agotado ni más unidades de las disponibles | `PedidoServicio` y Pantalla 1 |
| RN-013 | Todo pedido lleva un plazo de pago; si vence sin pago, se cancela y se libera el inventario | `PedidoServicio` y Pantalla 1 |
| CUS-02 FA-3 | Un pedido debe tener al menos un producto | `PedidoServicio` y Pantalla 1 |
| — | El cliente debe estar activo | `PedidoServicio` y Pantalla 1 |
| — | El valor total lo calcula el servidor: Σ(cantidad × valor) + domicilio | `PedidoServicio` |
| — | No se elimina un producto que esté en pedidos activos | `ProductoServicio` |

## Matriz de trazabilidad

| Requisito | Caso de uso | Diagrama | Widget (pantalla) | Endpoint |
|---|---|---|---|---|
| REQ001 Consultar catálogo | CUS-01 | Clases: Producto | P1 · buscador de productos / P2 · tabla | `GET /api/productos?query=` |
| REQ002 Seleccionar productos | CUS-02 (paso 5) | Actividad: Indicar pedido | P1 · tabla «Productos del pedido» (cantidad) | — (se envía en `POST /api/pedidos`) |
| REQ003 Registrar pedido | CUS-02 (pasos 10-11) | Actividad: Confirmar y registrar el pedido | P1 · botón «Confirmar pedido» | `POST /api/pedidos` |
| REQ004 Autogenerar id del pedido | CUS-02 (paso 11) | Clases: Pedido.id | P1 · modal «Pedido registrado» (PED-000001) | `POST /api/pedidos` |
| REQ005 Consultar disponibilidad | CUS-03 (include de CUS-02, paso 6) | Actividad: Confirmar disponibilidad | P1 · «N disponibles» y error en la fila | `GET /api/productos/{id}`, `POST /api/pedidos` |
| REQ006 Actualizar inventario | CUS-02 (paso 12) | Clases: Producto.unidadesDisponibles | P2 · columna «Unidades disponibles» | `POST /api/pedidos` |
| REQ007 Calcular valor total | CUS-02 (paso 8) | Clases: Pedido.valorTotal | P1 · «Total a pagar» y resumen lateral | `POST /api/pedidos` |
| REQ008 Seleccionar medio de pago (RN-001) | CUS-02 (paso 13) | Actividad: Informar valor total y medios de pago | P1 · «Medios de pago que se informan al cliente» | — (solo informativo en el MVP) |
| REQ021 Calcular costo del domicilio (RN-010) | CUS-02 (paso 8) | Clases: Pedido.costoDomicilio | P1 · «Tipo de entrega» | `POST /api/pedidos` |
| REQ046 Liberar inventario por plazo vencido (RN-013) | CUS-02 FA-6 | Clases: Pedido.fechaLimitePago | P1 · «Plazo de pago» | `PATCH /api/pedidos/{id}/cancelar` |
| Registrar cliente nuevo | CUS-02 FA-2 | Clases: Cliente | P1 · formulario «Cliente nuevo» | `POST /api/clientes` |
| CRUD de Producto | — | Clases: Producto | P2 · tabla, formulario y confirmación | `GET`, `POST`, `PUT`, `DELETE /api/productos` |

P1 = Registrar pedido (`RegistrarPedido.jsx`) · P2 = Productos (`Productos.jsx`).
En el código, cada validación de `PedidoServicio` lleva en un comentario el requisito, la regla o el flujo alterno que cumple.

## Casos de aceptación (`PedidoServicioTest`)

| Caso | Given | When | Then |
|---|---|---|---|
| CA-1 Flujo básico | Cliente activo, 3 blusas y 1 bolso disponibles | Pide 2 blusas y 1 bolso a domicilio en Armenia | Pedido *Pendiente de pago*, total $175.000 (incluye $5.000), inventario reservado, bolso agotado |
| CA-2 Stock insuficiente (RN-012) | Solo hay 3 blusas | Pide 4 blusas y 1 bolso | Se bloquea con RN-012 y no cambia el inventario de ningún producto |
| CA-3 Pedido sin productos (FA-3) | Cliente activo | Confirma sin productos | Se bloquea con CUS-02 FA-3 |
| CA-4 Plazo pasado (RN-013) | Cliente activo y producto disponible | Indica un plazo de pago anterior a hoy | Se bloquea con RN-013 |
| CA-5 Plazo vencido (FA-6) | Pedido pendiente que agotó el bolso | Se cancela el pedido | Pedido *Cancelado* y el bolso vuelve a estar disponible |
