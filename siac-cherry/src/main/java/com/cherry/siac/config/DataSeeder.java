package com.cherry.siac.config;

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
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

// DataSeeder — carga los datos de prueba al arrancar (quedan en memoria).
// 10 clientes (8 activos, 2 inactivos), 20 productos (2 agotados) y 8 pedidos en todos los estados.
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ClienteRepositorio clienteRepositorio;
    private final ProductoRepositorio productoRepositorio;
    private final PedidoRepositorio pedidoRepositorio;
    private final PedidoServicio pedidoServicio;

    @Override
    public void run(String... args) {
        if (clienteRepositorio.count() > 0) {
            return;
        }
        cargarClientes();
        cargarProductos();
        cargarPedidosDeEjemplo();

        System.out.println("=================================================");
        System.out.println("  SIAC Cherry - datos de prueba en memoria");
        System.out.println("  Clientes:  " + clienteRepositorio.count());
        System.out.println("  Productos: " + productoRepositorio.count());
        System.out.println("  Pedidos:   " + pedidoRepositorio.count());
        System.out.println("  Backend listo en: http://localhost:8080");
        System.out.println("=================================================");
    }

    private void cargarClientes() {
        clienteRepositorio.save(new Cliente(null, "Andrea Muñoz", "3104567890", "Cra 14 # 5-20, Armenia", "WhatsApp", EstadoCliente.ACTIVO));
        clienteRepositorio.save(new Cliente(null, "Mario Gómez", "3115678901", "Cll 21 # 16-35, Armenia", "Tienda física", EstadoCliente.ACTIVO));
        clienteRepositorio.save(new Cliente(null, "Laura Restrepo", "3126789012", "Av. Bolívar # 12-40, Armenia", "Instagram", EstadoCliente.ACTIVO));
        clienteRepositorio.save(new Cliente(null, "Camila Ospina", "3137890123", "Cra 19 # 8-15, Calarcá", "WhatsApp", EstadoCliente.ACTIVO));
        clienteRepositorio.save(new Cliente(null, "Valentina Cárdenas", "3148901234", "Cll 10 # 22-08, Armenia", "Facebook", EstadoCliente.ACTIVO));
        clienteRepositorio.save(new Cliente(null, "Juliana Marín", "3159012345", "Cra 6 # 30-12, Circasia", "Instagram", EstadoCliente.ACTIVO));
        clienteRepositorio.save(new Cliente(null, "Daniela Londoño", "3160123456", "Cll 50 # 14-60, Pereira", "WhatsApp", EstadoCliente.ACTIVO));
        clienteRepositorio.save(new Cliente(null, "Sofía Arango", "3171234567", "Cra 23 # 45-10, Manizales", "WhatsApp", EstadoCliente.ACTIVO));
        clienteRepositorio.save(new Cliente(null, "Paula Henao", "3182345678", "Cll 3 # 9-27, Montenegro", "Tienda física", EstadoCliente.INACTIVO));
        clienteRepositorio.save(new Cliente(null, "Natalia Quintero", "3193456789", "Cra 15 # 18-44, Armenia", "Facebook", EstadoCliente.INACTIVO));
    }

    private void cargarProductos() {
        productoRepositorio.save(new Producto(null, "Blusa", "M", "Rojo", new BigDecimal("45000"), 8, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Blusa", "S", "Blanco", new BigDecimal("45000"), 5, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Blusa", "L", "Negro", new BigDecimal("48000"), 1, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Jean", "8", "Azul", new BigDecimal("95000"), 6, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Jean", "10", "Negro", new BigDecimal("95000"), 4, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Vestido", "M", "Verde", new BigDecimal("120000"), 3, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Vestido", "S", "Rosado", new BigDecimal("125000"), 0, EstadoProducto.AGOTADO));
        productoRepositorio.save(new Producto(null, "Pijama", "M", "Lila", new BigDecimal("60000"), 7, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Pijama", "L", "Azul", new BigDecimal("60000"), 5, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Falda", "S", "Negro", new BigDecimal("55000"), 4, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Chaqueta", "M", "Beige", new BigDecimal("140000"), 2, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Bolso", "", "Negro", new BigDecimal("80000"), 6, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Bolso", "", "Café", new BigDecimal("85000"), 3, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Cartera", "", "Rojo", new BigDecimal("50000"), 5, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Aretes", "", "Dorado", new BigDecimal("18000"), 15, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Collar", "", "Plateado", new BigDecimal("25000"), 10, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Shampoo", "400 ml", "", new BigDecimal("32000"), 12, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Tratamiento capilar", "250 ml", "", new BigDecimal("38000"), 0, EstadoProducto.AGOTADO));
        productoRepositorio.save(new Producto(null, "Labial", "", "Rojo", new BigDecimal("22000"), 20, EstadoProducto.DISPONIBLE));
        productoRepositorio.save(new Producto(null, "Base de maquillaje", "", "Natural", new BigDecimal("42000"), 9, EstadoProducto.DISPONIBLE));
    }

    // Pedidos de ejemplo en todos los estados, para los paneles de Pedidos y Clientes.
    // Se crean con PedidoServicio (mismas reglas que la pantalla) y luego se ajustan
    // fechas y estados para simular pedidos antiguos.
    private void cargarPedidosDeEjemplo() {
        // PED-1 · Andrea Muñoz · pendiente de pago (Blusa M Rojo y Bolso Negro quedan "en pedido activo")
        crear(1L, TipoEntrega.DOMICILIO_ARMENIA, 8, 0, null, null, item(1L, 2), item(12L, 1));

        // PED-2 · Mario Gómez · entregado en tienda hace 10 días
        crear(2L, TipoEntrega.TIENDA, 5, 12, EstadoPedido.ENTREGADO, null, item(5L, 2), item(16L, 3));

        // PED-3 · Laura Restrepo · pagado, pendiente de entrega a domicilio
        crear(3L, TipoEntrega.DOMICILIO_ARMENIA, 6, 2, EstadoPedido.PAGADO, null, item(8L, 1), item(19L, 2));

        // PED-4 · Camila Ospina · envío nacional entregado
        crear(4L, TipoEntrega.ENVIO_NACIONAL, 5, 20, EstadoPedido.ENTREGADO, "SERV-48213", item(6L, 1));

        // PED-5 · Valentina Cárdenas · cancelado por plazo de pago vencido (RN-013)
        Pedido cancelado = crear(5L, TipoEntrega.DOMICILIO_ARMENIA, 5, 15, null, null, item(14L, 1), item(15L, 2));
        pedidoServicio.cancelarPedido(cancelado.getId());

        // PED-6 · Andrea Muñoz · segunda compra, entregada en tienda hace un mes
        crear(1L, TipoEntrega.TIENDA, 5, 30, EstadoPedido.ENTREGADO, null, item(20L, 1), item(17L, 1));

        // PED-7 · Juliana Marín · pendiente de pago con envío nacional
        crear(6L, TipoEntrega.ENVIO_NACIONAL, 3, 1, null, null, item(10L, 1));

        // PED-8 · Daniela Londoño · pagado, pendiente de envío nacional
        crear(7L, TipoEntrega.ENVIO_NACIONAL, 7, 3, EstadoPedido.PAGADO, null, item(13L, 1), item(16L, 1));
    }

    // plazoDias: días para pagar desde la fecha del pedido · haceDias: antigüedad del pedido
    private Pedido crear(Long clienteId, TipoEntrega entrega, int plazoDias, int haceDias,
                         EstadoPedido estadoFinal, String numeroGuia, ItemPedidoRequest... items) {
        LocalDate hoy = LocalDate.now();
        PedidoRequest dto = new PedidoRequest();
        dto.setClienteId(clienteId);
        dto.setItems(List.of(items));
        dto.setFechaLimitePago(hoy.plusDays(1));   // fecha válida para pasar la regla RN-013
        dto.setTipoEntrega(entrega);
        Pedido pedido = pedidoServicio.registrarPedido(dto);

        LocalDate fecha = hoy.minusDays(haceDias);
        pedido.setFecha(fecha);
        pedido.setFechaLimitePago(fecha.plusDays(plazoDias));
        if (estadoFinal != null) {
            pedido.setEstadoPedido(estadoFinal);
        }
        if (estadoFinal == EstadoPedido.ENTREGADO) {
            pedido.setFechaEntrega(fecha.plusDays(Math.min(4, haceDias)));
            pedido.setNumeroGuia(numeroGuia);
        }
        return pedidoRepositorio.save(pedido);
    }

    private ItemPedidoRequest item(Long productoId, int cantidad) {
        ItemPedidoRequest item = new ItemPedidoRequest();
        item.setProductoId(productoId);
        item.setCantidad(cantidad);
        return item;
    }
}
