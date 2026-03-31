package com.example.demo.controller;

import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Usuario user) {

        String matriculaRecibida = user.getMatricula() != null ? user.getMatricula().trim() : "";
        String passwordRecibida  = user.getPassword()  != null ? user.getPassword().trim()  : "";

        System.out.println("--- PRUEBA DE ACCESO ---");
        System.out.println("Matricula: [" + matriculaRecibida + "]");

        return usuarioRepository.findByMatricula(matriculaRecibida)
                .map(u -> {

                    if (u.getPassword().trim().equals(passwordRecibida)) {

                        // 🔒 Usuario bloqueado
                        if (Boolean.TRUE.equals(u.getBloqueado())) {
                            Map<String, Object> bloqueado = new HashMap<>();
                            bloqueado.put("status", "BLOQUEADO");
                            return new ResponseEntity<>(bloqueado, HttpStatus.FORBIDDEN);
                        }

                        // 🔥 RESPUESTA SEGÚN ROL
                        String respuesta = "ADMIN".equalsIgnoreCase(u.getRol())
                                ? "BIENVENIDO_ADMIN"
                                : "BIENVENIDO_VENDEDOR";

                        // 🚀 RESPUESTA COMPLETA (CLAVE DEL SAAS)
                        Map<String, Object> ok = new HashMap<>();
                        ok.put("status", respuesta);

                        Map<String, Object> usuarioData = new HashMap<>();
                        usuarioData.put("id", u.getId());
                        usuarioData.put("matricula", u.getMatricula());
                        usuarioData.put("rol", u.getRol());

                        // 🏢 EMPRESA (LO MÁS IMPORTANTE)
                        Map<String, Object> empresaData = new HashMap<>();
                        empresaData.put("id", u.getEmpresa().getId());

                        usuarioData.put("empresa", empresaData);

                        ok.put("usuario", usuarioData);

                        return new ResponseEntity<>(ok, HttpStatus.OK);
                    }

                    Map<String, Object> error = new HashMap<>();
                    error.put("status", "ERROR_PASSWORD");
                    return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
                })
                .orElseGet(() -> {
                    Map<String, Object> noEncontrado = new HashMap<>();
                    noEncontrado.put("status", "USUARIO_NO_ENCONTRADO");
                    return new ResponseEntity<>(noEncontrado, HttpStatus.NOT_FOUND);
                });
    }
}