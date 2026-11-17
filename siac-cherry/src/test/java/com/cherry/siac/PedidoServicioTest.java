package com.cherry.siac;

import com.cherry.siac.config.ReglaNegocioException;
import com.cherry.siac.dto.ItemPedidoRequest;
import com.cherry.siac.dto.PedidoRequest;
import com.cherry.siac.modelo.Cliente;
import com.cherry.siac.modelo.Pedido;
import com.cherry.siac.modelo.Producto;
import com.cherry.siac.modelo.enums.EstadoCliente;
import com.cherry.siac.modelo.enums.EstadoPedido;
import com.cherry.siac.modelo.enums.EstadoProducto;
import com.cherry.siac.modelo.enums.TipoEntrega;
import com.cherry.siac.repositorio.ClienteRepositorio;
import com.cherry.siac.repositorio.PedidoRepositorio;
import com.cherry.siac.repositorio.ProductoRepositorio;
import com.cherry.siac.servicio.PedidoServicio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

// Casos de aceptación (Given-When-Then) de la transacción "Registrar pedido"
class PedidoServicioTest {

    private ProductoRepositorio productos;
    private PedidoRepositorio pedidos;
    private PedidoServicio servicio;
    private Cliente andrea;
    private Producto blusa;   // 3 unidades, $45.000
    private Producto bolso;   // 1 unidad,  $80.000

    @BeforeEach
    void preparar() {
        ClienteRepositorio clientes = new ClienteRepositorio();
        productos = new ProductoRepositorio();
        pedidos = new PedidoRepositorio();
        servicio = new PedidoServicio(pedidos, clientes, productos);
        andrea = clientes.save(new Cliente(null, "Andrea Muñoz", "3104567890", "Cra 14", "WhatsApp", EstadoCliente.ACTIVO));
        blusa = productos.save(new Producto(null, "Blusa", "M", "Rojo", new BigDecimal("45000"), 3, EstadoProducto.DISPONIBLE));
        bolso = productos.save(new Producto(null, "Bolso", "", "Negro", new BigDecimal("80000"), 1, EstadoProducto.DISPONIBLE));
    }

    private PedidoRequest pedido(TipoEntrega entrega, LocalDate plazo, Object... productoYCantidad) {
        List<ItemPedidoRequest> items = new ArrayList<>();
        for (int i = 0; i < productoYCantidad.length; i += 2) {
            ItemPedidoRequest item = new ItemPedidoRequest();
            item.setProductoId(((Producto) productoYCantidad[i]).getId());
            item.setCantidad((Integer) productoYCantidad[i + 1]);
            items.add(item);
        }
        PedidoRequest dto = new PedidoRequest();
        dto.setClienteId(andrea.getId());
        dto.setItems(items);
        dto.setFechaLimitePago(plazo);
        dto.setTipoEntrega(entrega);
        return dto;
    }

    // CA-1 (flujo básico, REQ003/REQ004/REQ006/REQ007, RN-010)
    @Test
    void dadoUnPedidoValido_cuandoSeConfirma_entoncesSeRegistraCalculaElTotalYReservaInventario() {
        // Given: Andrea activa, 3 blusas y 1 bolso disponibles
        // When: pide 2 blusas y 1 bolso a domicilio en Armenia
        Pedido p = servicio.registrarPedido(
                pedido(TipoEntrega.DOMICILIO_ARMENIA, LocalDate.now().plusDays(5), blusa, 2, bolso, 1));
        // Then: queda pendiente de pago, total = 2×45.000 + 80.000 + 5.000, inventario reservado
        assertNotNull(p.getId());
        assertEquals(EstadoPedido.PENDIENTE_DE_PAGO, p.getEstadoPedido());
        assertEquals(0, new BigDecimal("175000").compareTo(p.getValorTotal()));
        assertEquals(0, new BigDecimal("5000").compareTo(p.getCostoDomicilio()));
        assertEquals(1, blusa.getUnidadesDisponibles());
        assertEquals(0, bolso.getUnidadesDisponibles());
        assertEquals(EstadoProducto.AGOTADO, bolso.getEstadoProducto());
    }

    // CA-2 (flujo bloqueante, RN-012 / CUS-02 FA-1)
    @Test
    void dadoStockInsuficiente_cuandoSeConfirma_entoncesSeBloqueaYNoCambiaElInventario() {
        // Given: solo hay 3 blusas  /  When: se piden 4 (y 1 bolso válido)
        ReglaNegocioException ex = assertThrows(ReglaNegocioException.class, () ->
                servicio.registrarPedido(pedido(TipoEntrega.TIENDA, LocalDate.now().plusDays(5), bolso, 1, blusa, 4)));
        // Then: se informa la regla y no se toca el inventario de ningún producto
        assertEquals("RN-012", ex.getRegla());
        assertEquals(3, blusa.getUnidadesDisponibles());
        assertEquals(1, bolso.getUnidadesDisponibles());
        assertEquals(0, pedidos.count());
    }

    // CA-3 (flujo bloqueante, CUS-02 FA-3)
    @Test
    void dadoUnPedidoSinProductos_cuandoSeConfirma_entoncesSeBloquea() {
        ReglaNegocioException ex = assertThrows(ReglaNegocioException.class, () ->
                servicio.registrarPedido(pedido(TipoEntrega.TIENDA, LocalDate.now().plusDays(5))));
        assertEquals("CUS-02 FA-3", ex.getRegla());
    }

    // CA-4 (flujo bloqueante, RN-013)
    @Test
    void dadoUnPlazoDePagoPasado_cuandoSeConfirma_entoncesSeBloquea() {
        ReglaNegocioException ex = assertThrows(ReglaNegocioException.class, () ->
                servicio.registrarPedido(pedido(TipoEntrega.TIENDA, LocalDate.now().minusDays(1), blusa, 1)));
        assertEquals("RN-013", ex.getRegla());
        assertEquals(3, blusa.getUnidadesDisponibles());
    }

    // CA-5 (CUS-02 FA-6, RN-013): plazo vencido → se cancela y el producto vuelve a estar disponible
    @Test
    void dadoUnPedidoPendiente_cuandoSeCancelaPorPlazoVencido_entoncesSeLiberaElInventario() {
        Pedido p = servicio.registrarPedido(pedido(TipoEntrega.TIENDA, LocalDate.now().plusDays(1), bolso, 1));
        assertEquals(EstadoProducto.AGOTADO, bolso.getEstadoProducto());
        Pedido cancelado = servicio.cancelarPedido(p.getId());
        assertEquals(EstadoPedido.CANCELADO, cancelado.getEstadoPedido());
        assertEquals(1, bolso.getUnidadesDisponibles());
        assertEquals(EstadoProducto.DISPONIBLE, bolso.getEstadoProducto());
    }
}
