package com.cherry.siac.dto;

import com.cherry.siac.modelo.enums.TipoEntrega;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

// PedidoRequest — datos que envía la pantalla "Registrar pedido" (CUS-02)
@Data
public class PedidoRequest {
    private Long clienteId;
    private List<ItemPedidoRequest> items;
    private LocalDate fechaLimitePago;
    private TipoEntrega tipoEntrega;
}
