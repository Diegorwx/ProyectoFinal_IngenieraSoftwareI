package com.cherry.siac.controlador;

import com.cherry.siac.modelo.Cliente;
import com.cherry.siac.servicio.ClienteServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// Endpoints de clientes: los usa el buscador de la pantalla "Registrar pedido"
@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteControlador {
    private final ClienteServicio clienteServicio;

    // GET /api/clientes?query=texto
    @GetMapping
    public ResponseEntity<List<Cliente>> listarOBuscar(@RequestParam(required = false) String query) {
        if (query != null && !query.isBlank()) {
            return ResponseEntity.ok(clienteServicio.buscar(query));
        }
        return ResponseEntity.ok(clienteServicio.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(clienteServicio.buscarPorId(id));
    }

    // POST /api/clientes — CUS-02 FA-2: Cliente no registrado
    @PostMapping
    public ResponseEntity<Cliente> crear(@RequestBody Cliente cliente) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteServicio.crear(cliente));
    }
}
