package com.cherry.siac.controlador;

import com.cherry.siac.dto.PedidoRequest;
import com.cherry.siac.modelo.Pedido;
import com.cherry.siac.servicio.PedidoServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// Endpoints de la transacción "Registrar pedido" (CUS-02, Pantalla 1)
@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoControlador {
    private final PedidoServicio pedidoServicio;

    // GET /api/pedidos?clienteId=1
    @GetMapping
    public ResponseEntity<List<Pedido>> listar(@RequestParam(required = false) Long clienteId) {
        if (clienteId != null) {
            return ResponseEntity.ok(pedidoServicio.listarPorCliente(clienteId));
        }
        return ResponseEntity.ok(pedidoServicio.listarTodos());
    }

    // POST /api/pedidos — REQ003 Registrar pedido (valida las reglas y reserva el inventario)
    @PostMapping
    public ResponseEntity<Pedido> crear(@RequestBody PedidoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoServicio.registrarPedido(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pedido> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoServicio.buscarPorId(id));
    }

    // PATCH /api/pedidos/{id}/cancelar — CUS-02 FA-6: plazo de pago vencido, libera el inventario
    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<Pedido> cancelar(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoServicio.cancelarPedido(id));
    }
}
