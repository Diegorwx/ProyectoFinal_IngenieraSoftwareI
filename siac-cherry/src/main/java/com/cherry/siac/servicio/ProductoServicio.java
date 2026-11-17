package com.cherry.siac.servicio;

import com.cherry.siac.config.ReglaNegocioException;
import com.cherry.siac.modelo.Producto;
import com.cherry.siac.modelo.enums.EstadoProducto;
import com.cherry.siac.repositorio.PedidoRepositorio;
import com.cherry.siac.repositorio.ProductoRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

// CRUD de Producto (Pantalla 2) y consulta del catálogo (CUS-01, CUS-03)
@Service
@RequiredArgsConstructor
public class ProductoServicio {
    private final ProductoRepositorio productoRepositorio;
    private final PedidoRepositorio pedidoRepositorio;

    // REQ001 - Consultar catálogo
    public List<Producto> listarTodos() {
        return productoRepositorio.findAll();
    }

    public List<Producto> buscar(String query) {
        return productoRepositorio.buscarPorTexto(query);
    }

    // REQ005 - Consultar disponibilidad (CUS-03)
    public Producto buscarPorId(Long id) {
        return productoRepositorio.findById(id)
                .orElseThrow(() -> new ReglaNegocioException("CUS-03 FA-1",
                        "No se encontró un producto con el id: " + id));
    }

    public Producto crear(Producto producto) {
        validar(producto, null);
        producto.setId(null);
        ajustarEstado(producto);
        return productoRepositorio.save(producto);
    }

    public Producto actualizar(Long id, Producto datos) {
        Producto existente = buscarPorId(id);
        validar(datos, id);
        existente.setTipo(datos.getTipo().trim());
        existente.setTalla(datos.getTalla());
        existente.setColor(datos.getColor());
        existente.setValor(datos.getValor());
        existente.setUnidadesDisponibles(datos.getUnidadesDisponibles());
        existente.setEstadoProducto(datos.getEstadoProducto());
        ajustarEstado(existente);
        return productoRepositorio.save(existente);
    }

    // No se puede eliminar un producto que esté en pedidos activos
    public void eliminar(Long id) {
        Producto producto = buscarPorId(id);
        if (pedidoRepositorio.productoEnPedidosActivos(id)) {
            throw new ReglaNegocioException("CRUD-PRODUCTO",
                    "No se puede eliminar '" + descripcion(producto)
                            + "' porque está en pedidos activos.");
        }
        productoRepositorio.deleteById(id);
    }

    // Validaciones del formulario (también se validan en la pantalla)
    private void validar(Producto p, Long idExcluido) {
        if (p.getTipo() == null || p.getTipo().isBlank()) {
            throw new ReglaNegocioException("CRUD-PRODUCTO", "El tipo de producto es obligatorio.");
        }
        if (p.getValor() == null || p.getValor().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ReglaNegocioException("CRUD-PRODUCTO", "El valor debe ser mayor a 0.");
        }
        if (p.getUnidadesDisponibles() == null || p.getUnidadesDisponibles() < 0) {
            throw new ReglaNegocioException("CRUD-PRODUCTO",
                    "Las unidades disponibles deben ser un número entero mayor o igual a 0.");
        }
        if (productoRepositorio.existeIgual(p.getTipo(), p.getTalla(), p.getColor(), idExcluido)) {
            throw new ReglaNegocioException("CRUD-PRODUCTO",
                    "Ya existe un producto con el mismo tipo, talla y color.");
        }
    }

    // Un producto sin unidades queda AGOTADO
    private void ajustarEstado(Producto p) {
        if (p.getUnidadesDisponibles() == 0) {
            p.setEstadoProducto(EstadoProducto.AGOTADO);
        } else if (p.getEstadoProducto() == null) {
            p.setEstadoProducto(EstadoProducto.DISPONIBLE);
        }
    }

    public static String descripcion(Producto p) {
        StringBuilder sb = new StringBuilder(p.getTipo());
        if (p.getTalla() != null && !p.getTalla().isBlank()) sb.append(" ").append(p.getTalla());
        if (p.getColor() != null && !p.getColor().isBlank()) sb.append(" ").append(p.getColor());
        return sb.toString();
    }
}
