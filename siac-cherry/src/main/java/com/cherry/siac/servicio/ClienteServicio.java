package com.cherry.siac.servicio;

import com.cherry.siac.config.ReglaNegocioException;
import com.cherry.siac.modelo.Cliente;
import com.cherry.siac.modelo.enums.EstadoCliente;
import com.cherry.siac.repositorio.ClienteRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

// Clientes: búsqueda para el pedido y registro de cliente nuevo (CUS-02, flujo alterno 2)
@Service
@RequiredArgsConstructor
public class ClienteServicio {
    private final ClienteRepositorio clienteRepositorio;

    public List<Cliente> listarTodos() {
        return clienteRepositorio.findAll();
    }

    public List<Cliente> buscar(String query) {
        return clienteRepositorio.buscarPorTexto(query);
    }

    public Cliente buscarPorId(Long id) {
        return clienteRepositorio.findById(id)
                .orElseThrow(() -> new ReglaNegocioException("CUS-02",
                        "No se encontró un cliente con el id: " + id));
    }

    // CUS-02 FA-2: Cliente no registrado
    public Cliente crear(Cliente cliente) {
        if (vacio(cliente.getNombre())) {
            throw new ReglaNegocioException("CUS-02 FA-2", "El nombre del cliente es obligatorio.");
        }
        if (vacio(cliente.getTelefono())) {
            throw new ReglaNegocioException("CUS-02 FA-2", "El teléfono del cliente es obligatorio.");
        }
        if (clienteRepositorio.existeTelefono(cliente.getTelefono().trim())) {
            throw new ReglaNegocioException("CUS-02 FA-2",
                    "Ya existe un cliente registrado con el teléfono: " + cliente.getTelefono());
        }
        cliente.setId(null);
        cliente.setNombre(cliente.getNombre().trim());
        cliente.setTelefono(cliente.getTelefono().trim());
        cliente.setEstadoCliente(EstadoCliente.ACTIVO);
        return clienteRepositorio.save(cliente);
    }

    private boolean vacio(String valor) {
        return valor == null || valor.isBlank();
    }
}
