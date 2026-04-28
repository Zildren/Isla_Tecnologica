package com.example.demo.dto;

import lombok.Data;   // ← sin el http://

@Data
public class CrearEmpresaRequest {
    private String nombre;
    private String propietario;
    private String telefono;
    private String email;
    private String plan;
    private Boolean activo;
    private String fechaVencimiento;
    private String adminUser;
    private String adminPass;
}