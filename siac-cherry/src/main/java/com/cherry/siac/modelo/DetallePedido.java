package com.cherry.siac.modelo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

// Clase DetallePedido del Diagrama de Clases: un producto dentro de un pedido
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetallePedido {
    private Producto producto;
    private Integer cantidad;
    private BigDecimal valorUnitario;

    // Subtotal = cantidad × valorUnitario (parte de la invariante del valor total)
    public BigDecimal getSubtotal() {
        return valorUnitario.multiply(BigDecimal.valueOf(cantidad));
    }
}
