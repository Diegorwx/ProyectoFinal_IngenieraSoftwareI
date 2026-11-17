package com.cherry.siac.modelo;

import com.cherry.siac.modelo.enums.EstadoCliente;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Clase Cliente del Diagrama de Clases (Gestión Humana)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {
    private Long id;
    private String nombre;
    private String telefono;
    private String direccion;
    private String canalContacto;
    private EstadoCliente estadoCliente = EstadoCliente.ACTIVO;
}
