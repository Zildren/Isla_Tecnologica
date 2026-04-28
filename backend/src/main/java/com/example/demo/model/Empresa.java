package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "empresas")
@Data
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String propietario;
    private String telefono;
    private String email;

    private String plan; // FREE, BASIC, PRO, ENTERPRISE

    private Boolean activo = true;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    // Estos los puedes mantener o eliminar si el frontend los maneja en memoria
    @Column(name = "limite_usuarios")
    private Integer limiteUsuarios;

    @Column(name = "limite_productos")
    private Integer limiteProductos;
}