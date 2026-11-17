package com.cherry.siac.repositorio;

import com.cherry.siac.modelo.Cliente;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.stream.Collectors;

// Guarda los clientes en memoria (HashMap). El id se genera solo.
@Component
public class ClienteRepositorio {
    private final Map<Long, Cliente> datos = new LinkedHashMap<>();
    private long contadorId = 1;

    public Cliente save(Cliente cliente) {
        if (cliente.getId() == null) {
            cliente.setId(contadorId++);
        }
        datos.put(cliente.getId(), cliente);
        return cliente;
    }

    public List<Cliente> findAll() {
        return new ArrayList<>(datos.values());
    }

    public Optional<Cliente> findById(Long id) {
        return Optional.ofNullable(datos.get(id));
    }

    public long count() {
        return datos.size();
    }

    public boolean existeTelefono(String telefono) {
        return datos.values().stream().anyMatch(c -> c.getTelefono().equals(telefono));
    }

    public List<Cliente> buscarPorTexto(String texto) {
        String t = texto.toLowerCase();
        return datos.values().stream()
                .filter(c -> c.getNombre().toLowerCase().contains(t) || c.getTelefono().contains(t))
                .collect(Collectors.toList());
    }
}
