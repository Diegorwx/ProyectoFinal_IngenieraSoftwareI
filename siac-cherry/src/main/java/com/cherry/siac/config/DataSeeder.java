package com.cherry.siac.config;

import com.cherry.siac.dto.ItemPedidoRequest;
import com.cherry.siac.dto.PedidoRequest;
import com.cherry.siac.modelo.Cliente;
import com.cherry.siac.modelo.Producto;
import com.cherry.siac.modelo.enums.EstadoCliente;
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
// 10 clientes (8 activos, 2 inactivos), 20 productos (2 agotados) y 1 pedido de ejemplo.
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
        cargarPedidoDeEjemplo();

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

    // Un pedido de Andrea Muñoz (cliente 1): 2 blusas M rojas y 1 bolso negro, a domicilio
    private void cargarPedidoDeEjemplo() {
        ItemPedidoRequest blusa = new ItemPedidoRequest();
        blusa.setProductoId(1L);
        blusa.setCantidad(2);
        ItemPedidoRequest bolso = new ItemPedidoRequest();
        bolso.setProductoId(12L);
        bolso.setCantidad(1);

        PedidoRequest pedido = new PedidoRequest();
        pedido.setClienteId(1L);
        pedido.setItems(List.of(blusa, bolso));
        pedido.setFechaLimitePago(LocalDate.now().plusDays(8));
        pedido.setTipoEntrega(TipoEntrega.DOMICILIO_ARMENIA);
        pedidoServicio.registrarPedido(pedido);
    }
}
