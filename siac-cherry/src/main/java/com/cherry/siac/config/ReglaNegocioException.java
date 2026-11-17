package com.cherry.siac.config;

import lombok.Getter;

// Error de validación que indica qué regla o flujo alterno se incumplió.
// El código (por ejemplo "RN-012" o "CUS-02 FA-3") viaja al frontend para la trazabilidad.
@Getter
public class ReglaNegocioException extends RuntimeException {
    private final String regla;

    public ReglaNegocioException(String regla, String mensaje) {
        super(mensaje);
        this.regla = regla;
    }
}
