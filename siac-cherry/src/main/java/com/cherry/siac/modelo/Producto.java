package com.cherry.siac.modelo;

import com.cherry.siac.modelo.enums.EstadoProducto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

// Clase Producto del Diagrama de Clases (Inventarios)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Producto {
    private Long id;
    private String tipo;
    private String talla;
    private String color;
    private BigDecimal valor;
    private Integer unidadesDisponibles;
    private EstadoProducto estadoProducto = EstadoProducto.DISPONIBLE;
}
