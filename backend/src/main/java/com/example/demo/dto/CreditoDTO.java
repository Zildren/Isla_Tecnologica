package com.example.demo.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public class CreditoDTO {
    @Data public static class ClienteRequest {
        private String nombre, telefono, descripcion;
        private BigDecimal montoTotal;
    }
    @Data public static class AbonoRequest {
        private BigDecimal monto;
        private String nota;
    }
    @Data public static class ClienteResponse {
        private Long id;
        private String nombre, telefono, descripcion, registradoPor;
        private BigDecimal montoTotal, saldoPendiente;
        private LocalDate fechaInicio;
    }
    @Data public static class AbonoResponse {
        private Long id, clienteId;
        private BigDecimal monto;
        private String nota, registradoPor;
        private LocalDate fecha;
        private LocalTime hora;
    }
}