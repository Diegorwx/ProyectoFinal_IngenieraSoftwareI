package com.cherry.siac.modelo;

import com.cherry.siac.modelo.enums.EstadoPedido;
import com.cherry.siac.modelo.enums.TipoEntrega;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Clase Pedido del Diagrama de Clases (Pagos)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pedido {
    private Long id;
    private Cliente cliente;
    private LocalDate fecha;
    private EstadoPedido estadoPedido = EstadoPedido.PENDIENTE_DE_PAGO;
    private BigDecimal valorTotal;
    private TipoEntrega tipoEntrega;
    private BigDecimal costoDomicilio;
    private LocalDate fechaLimitePago;
    private String numeroGuia;
    private LocalDate fechaEntrega;
    private List<DetallePedido> detalles = new ArrayList<>();
}
