package com.cherry.siac.servicio;

import com.cherry.siac.config.ReglaNegocioException;
import com.cherry.siac.dto.ItemPedidoRequest;
import com.cherry.siac.dto.PedidoRequest;
import com.cherry.siac.modelo.Cliente;
import com.cherry.siac.modelo.DetallePedido;
import com.cherry.siac.modelo.Pedido;
import com.cherry.siac.modelo.Producto;
import com.cherry.siac.modelo.enums.EstadoCliente;
import com.cherry.siac.modelo.enums.EstadoPedido;
import com.cherry.siac.modelo.enums.EstadoProducto;
import com.cherry.siac.modelo.enums.TipoEntrega;
import com.cherry.siac.repositorio.ClienteRepositorio;
import com.cherry.siac.repositorio.PedidoRepositorio;
import com.cherry.siac.repositorio.ProductoRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// PedidoServicio — transacción "Registrar pedido" (CUS-02, Pantalla 1)
// Cada validación indica el requisito, la regla o el flujo alterno que cumple.
@Service
@RequiredArgsConstructor
public class PedidoServicio {

    // RN-010: el domicilio en Armenia tiene un costo fijo
    public static final BigDecimal COSTO_DOMICILIO_ARMENIA = new BigDecimal("5000");

    private final PedidoRepositorio pedidoRepositorio;
    private final ClienteRepositorio clienteRepositorio;
    private final ProductoRepositorio productoRepositorio;

    // REQ003 - Registrar pedido
    public synchronized Pedido registrarPedido(PedidoRequest dto) {

        // --- Paso 3 del flujo básico: el pedido pertenece a un cliente ---
        if (dto.getClienteId() == null) {
            throw new ReglaNegocioException("CUS-02", "Selecciona un cliente para registrar el pedido.");
        }
        Cliente cliente = clienteRepositorio.findById(dto.getClienteId())
                .orElseThrow(() -> new ReglaNegocioException("CUS-02 FA-2",
                        "No se encontró un cliente con el id: " + dto.getClienteId()));
        if (cliente.getEstadoCliente() == EstadoCliente.INACTIVO) {
            throw new ReglaNegocioException("CUS-02",
                    "El cliente está inactivo y no puede registrar pedidos.");
        }

        // --- CUS-02 FA-3: Pedido sin productos ---
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new ReglaNegocioException("CUS-02 FA-3", "Agrega al menos un producto al pedido.");
        }

        // --- RN-013: el pedido lleva un plazo de pago acordado con el cliente ---
        if (dto.getFechaLimitePago() == null) {
            throw new ReglaNegocioException("RN-013", "Indica el plazo de pago acordado con el cliente.");
        }
        if (dto.getFechaLimitePago().isBefore(LocalDate.now())) {
            throw new ReglaNegocioException("RN-013", "El plazo de pago no puede ser una fecha pasada.");
        }

        // Si el mismo producto viene en dos renglones, se suman las cantidades
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        for (ItemPedidoRequest item : dto.getItems()) {
            if (item.getProductoId() == null) {
                throw new ReglaNegocioException("CUS-02", "Cada renglón del pedido debe tener un producto.");
            }
            if (item.getCantidad() == null || item.getCantidad() <= 0) {
                throw new ReglaNegocioException("CUS-02", "La cantidad de cada producto debe ser mayor a 0.");
            }
            cantidades.merge(item.getProductoId(), item.getCantidad(), Integer::sum);
        }

        // --- Paso 6 (include CUS-03 Consultar disponibilidad) ---
        // Primero se validan TODOS los productos; el inventario solo se toca si todo es válido.
        List<DetallePedido> detalles = new ArrayList<>();
        for (Map.Entry<Long, Integer> entrada : cantidades.entrySet()) {
            Producto producto = productoRepositorio.findById(entrada.getKey())
                    .orElseThrow(() -> new ReglaNegocioException("CUS-03 FA-1",
                            "No se encontró un producto con el id: " + entrada.getKey()));
            int cantidad = entrada.getValue();
            String nombre = ProductoServicio.descripcion(producto);

            // RN-012 (CUS-03 FA-2): no se vende un producto agotado
            if (producto.getEstadoProducto() != EstadoProducto.DISPONIBLE
                    || producto.getUnidadesDisponibles() == 0) {
                throw new ReglaNegocioException("RN-012",
                        "El producto '" + nombre + "' está agotado.");
            }
            // RN-012 (CUS-02 FA-1, CUS-03 FA-3): la cantidad no supera las unidades disponibles
            if (cantidad > producto.getUnidadesDisponibles()) {
                throw new ReglaNegocioException("RN-012",
                        "Solo hay " + producto.getUnidadesDisponibles()
                                + " unidad(es) disponible(s) de '" + nombre + "'.");
            }
            detalles.add(new DetallePedido(producto, cantidad, producto.getValor()));
        }

        // --- REQ021 / RN-010: costo fijo del domicilio en Armenia ---
        TipoEntrega tipoEntrega = dto.getTipoEntrega() == null ? TipoEntrega.TIENDA : dto.getTipoEntrega();
        BigDecimal costoDomicilio = tipoEntrega == TipoEntrega.DOMICILIO_ARMENIA
                ? COSTO_DOMICILIO_ARMENIA : BigDecimal.ZERO;

        // --- REQ007 - Calcular valor total: lo calcula el servidor, no la pantalla ---
        // Invariante: valorTotal = Σ(cantidad × valorUnitario) + costoDomicilio
        BigDecimal valorTotal = costoDomicilio;
        for (DetallePedido detalle : detalles) {
            valorTotal = valorTotal.add(detalle.getSubtotal());
        }

        // --- REQ006 - Actualizar inventario: se reservan las unidades del pedido ---
        for (DetallePedido detalle : detalles) {
            Producto producto = detalle.getProducto();
            producto.setUnidadesDisponibles(producto.getUnidadesDisponibles() - detalle.getCantidad());
            if (producto.getUnidadesDisponibles() == 0) {
                producto.setEstadoProducto(EstadoProducto.AGOTADO);
            }
            productoRepositorio.save(producto);
        }

        // --- Paso 11: el pedido queda Pendiente de pago (REQ004: el id lo genera el repositorio) ---
        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setFecha(LocalDate.now());
        pedido.setEstadoPedido(EstadoPedido.PENDIENTE_DE_PAGO);
        pedido.setTipoEntrega(tipoEntrega);
        pedido.setCostoDomicilio(costoDomicilio);
        pedido.setValorTotal(valorTotal);
        pedido.setFechaLimitePago(dto.getFechaLimitePago());
        pedido.setDetalles(detalles);
        return pedidoRepositorio.save(pedido);
    }

    // CUS-02 FA-6 / RN-013: si el cliente no paga en el plazo, el pedido se cancela
    // y los productos vuelven a estar disponibles.
    public synchronized Pedido cancelarPedido(Long id) {
        Pedido pedido = buscarPorId(id);
        if (pedido.getEstadoPedido() != EstadoPedido.PENDIENTE_DE_PAGO) {
            throw new ReglaNegocioException("RN-013",
                    "Solo se puede cancelar un pedido pendiente de pago.");
        }
        for (DetallePedido detalle : pedido.getDetalles()) {
            Producto producto = detalle.getProducto();
            producto.setUnidadesDisponibles(producto.getUnidadesDisponibles() + detalle.getCantidad());
            producto.setEstadoProducto(EstadoProducto.DISPONIBLE);
            productoRepositorio.save(producto);
        }
        pedido.setEstadoPedido(EstadoPedido.CANCELADO);
        return pedidoRepositorio.save(pedido);
    }

    public Pedido buscarPorId(Long id) {
        return pedidoRepositorio.findById(id)
                .orElseThrow(() -> new ReglaNegocioException("CUS-02",
                        "No se encontró un pedido con el id: " + id));
    }

    public List<Pedido> listarTodos() {
        return pedidoRepositorio.findAll();
    }

    public List<Pedido> listarPorCliente(Long clienteId) {
        return pedidoRepositorio.findByClienteId(clienteId);
    }
}
