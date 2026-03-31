package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
public class Gasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    private Double monto;

    @Column(nullable = false)
    private String categoria;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fecha;

    private String registradoPor;

    private LocalDateTime creadoEn;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "empresa_id")
    @JsonIgnore
    private Empresa empresa;

    @PrePersist
    protected void onCreate() {
        if (this.creadoEn == null) this.creadoEn = LocalDateTime.now();
    }
}