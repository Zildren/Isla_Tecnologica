package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String codigo;

    private String nombre;
    private Integer stock;
    private Double precioCompra;
    private Double precioVenta;
    private String categoria;

    @Column(columnDefinition = "LONGTEXT")
    private String imagen;

    private String registradoPorMatricula;
    private LocalDateTime fechaRegistro;

    @PrePersist
    protected void onCreate() {
        this.fechaRegistro = LocalDateTime.now();
    }
}