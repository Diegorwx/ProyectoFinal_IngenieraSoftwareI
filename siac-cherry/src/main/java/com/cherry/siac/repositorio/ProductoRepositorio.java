package com.cherry.siac.repositorio;

import com.cherry.siac.modelo.Producto;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.stream.Collectors;

// Guarda los productos en memoria (HashMap). REQ: el id se genera solo.
@Component
public class ProductoRepositorio {
    private final Map<Long, Producto> datos = new LinkedHashMap<>();
    private long contadorId = 1;

    public Producto save(Producto producto) {
        if (producto.getId() == null) {
            producto.setId(contadorId++);
        }
        datos.put(producto.getId(), producto);
        return producto;
    }

    public List<Producto> findAll() {
        return new ArrayList<>(datos.values());
    }

    public Optional<Producto> findById(Long id) {
        return Optional.ofNullable(datos.get(id));
    }

    public void deleteById(Long id) {
        datos.remove(id);
    }

    public long count() {
        return datos.size();
    }

    // Busca por tipo, talla o color (REQ001 - Consultar catálogo)
    public List<Producto> buscarPorTexto(String texto) {
        String t = texto.toLowerCase();
        return datos.values().stream()
                .filter(p -> p.getTipo().toLowerCase().contains(t)
                        || texto(p.getTalla()).contains(t)
                        || texto(p.getColor()).contains(t))
                .collect(Collectors.toList());
    }

    // Dos productos son el mismo si coinciden tipo, talla y color
    public boolean existeIgual(String tipo, String talla, String color, Long idExcluido) {
        return datos.values().stream().anyMatch(p ->
                !p.getId().equals(idExcluido)
                        && p.getTipo().equalsIgnoreCase(tipo)
                        && texto(p.getTalla()).equals(texto(talla))
                        && texto(p.getColor()).equals(texto(color)));
    }

    private String texto(String valor) {
        return valor == null ? "" : valor.trim().toLowerCase();
    }
}
