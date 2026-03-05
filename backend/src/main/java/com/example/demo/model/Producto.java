package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data // Esto genera automáticamente los Getters y Setters
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String codigo; // El código para identificación rápida que pediste

    private String nombre; // Fundas, micas, cargadores, etc.
    private Integer stock;
    private Double precioCompra; // Para calcular tus gastos
    private Double precioVenta;  // Para calcular tus ganancias
    private String categoria;

    // Campos para el control total: quién, fecha y hora
    private String registradoPorMatricula; 
    private LocalDateTime fechaRegistro;

    @PrePersist
    protected void onCreate() {
        this.fechaRegistro = LocalDateTime.now();
    }
}