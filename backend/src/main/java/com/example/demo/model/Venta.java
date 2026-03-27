package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Data
public class Venta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String codigoProducto;
    private String nombreProducto;
    private Integer cantidad;
    private Double precioVenta;
    private Double total;
    private String vendedorMatricula;

    @Column(nullable = false, columnDefinition = "DOUBLE PRECISION DEFAULT 0")
    private Double precioCompra = 0.0;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaVenta;

    @PrePersist
    protected void onCreate() {
        this.fechaVenta = LocalDateTime.now();
        if (this.precioCompra == null) this.precioCompra = 0.0;
    }
}