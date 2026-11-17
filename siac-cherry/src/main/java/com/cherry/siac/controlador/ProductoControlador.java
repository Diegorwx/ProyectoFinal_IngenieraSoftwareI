package com.cherry.siac.controlador;

import com.cherry.siac.modelo.Producto;
import com.cherry.siac.servicio.ProductoServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// Endpoints del CRUD de Producto (Pantalla 2) y del catálogo (CUS-01, CUS-03)
@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoControlador {
    private final ProductoServicio productoServicio;

    // GET /api/productos?query=texto — REQ001 Consultar catálogo
    @GetMapping
    public ResponseEntity<List<Producto>> listarOBuscar(@RequestParam(required = false) String query) {
        if (query != null && !query.isBlank()) {
            return ResponseEntity.ok(productoServicio.buscar(query));
        }
        return ResponseEntity.ok(productoServicio.listarTodos());
    }

    // GET /api/productos/{id} — REQ005 Consultar disponibilidad
    @GetMapping("/{id}")
    public ResponseEntity<Producto> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(productoServicio.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Producto> crear(@RequestBody Producto producto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoServicio.crear(producto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizar(@PathVariable Long id, @RequestBody Producto datos) {
        return ResponseEntity.ok(productoServicio.actualizar(id, datos));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        productoServicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
