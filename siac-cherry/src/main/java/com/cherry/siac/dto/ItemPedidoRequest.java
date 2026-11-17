package com.cherry.siac.dto;

import lombok.Data;

// Un renglón del pedido: qué producto y cuántas unidades
@Data
public class ItemPedidoRequest {
    private Long productoId;
    private Integer cantidad;
}
