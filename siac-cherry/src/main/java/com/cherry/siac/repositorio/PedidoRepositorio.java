package com.cherry.siac.repositorio;

import com.cherry.siac.modelo.Pedido;
import com.cherry.siac.modelo.enums.EstadoPedido;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.stream.Collectors;

// Guarda los pedidos en memoria (HashMap).
@Component
public class PedidoRepositorio {
    private final Map<Long, Pedido> datos = new LinkedHashMap<>();
    private long contadorId = 1;

    // REQ004 - Autogenerar id del pedido: identificador único e incremental
    public Pedido save(Pedido pedido) {
        if (pedido.getId() == null) {
            pedido.setId(contadorId++);
        }
        datos.put(pedido.getId(), pedido);
        return pedido;
    }

    public List<Pedido> findAll() {
        return new ArrayList<>(datos.values());
    }

    public Optional<Pedido> findById(Long id) {
        return Optional.ofNullable(datos.get(id));
    }

    public long count() {
        return datos.size();
    }

    public List<Pedido> findByClienteId(Long clienteId) {
        return datos.values().stream()
                .filter(p -> p.getCliente().getId().equals(clienteId))
                .collect(Collectors.toList());
    }

    // ¿El producto está en algún pedido que todavía no se entrega ni se cancela?
    public boolean productoEnPedidosActivos(Long productoId) {
        return datos.values().stream()
                .filter(p -> p.getEstadoPedido() == EstadoPedido.PENDIENTE_DE_PAGO
                        || p.getEstadoPedido() == EstadoPedido.PAGADO)
                .anyMatch(p -> p.getDetalles().stream()
                        .anyMatch(d -> d.getProducto().getId().equals(productoId)));
    }
}
