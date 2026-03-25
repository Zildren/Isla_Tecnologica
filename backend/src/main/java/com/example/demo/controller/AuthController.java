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
    public ResponseEntity<Map<String, String>> login(@RequestBody Usuario user) {
        String matriculaRecibida = user.getMatricula() != null ? user.getMatricula().trim() : "";
        String passwordRecibida  = user.getPassword()  != null ? user.getPassword().trim()  : "";

        System.out.println("--- PRUEBA DE ACCESO ---");
        System.out.println("Matricula: [" + matriculaRecibida + "] / Password: [" + passwordRecibida + "]");

        return usuarioRepository.findByMatricula(matriculaRecibida)
                .map(u -> {
                    System.out.println("Encontrado en DB: [" + u.getMatricula() + "] / Rol: [" + u.getRol() + "]");

                    if (u.getPassword().trim().equals(passwordRecibida)) {

                        if (Boolean.TRUE.equals(u.getBloqueado())) {
                            Map<String, String> bloqueado = new HashMap<>();
                            bloqueado.put("status", "BLOQUEADO");
                            bloqueado.put("rol", "");
                            return new ResponseEntity<>(bloqueado, HttpStatus.FORBIDDEN);
                        }

                        String respuesta = "ADMIN".equalsIgnoreCase(u.getRol())
                                ? "BIENVENIDO_ADMIN"
                                : "BIENVENIDO_VENDEDOR";

                        Map<String, String> ok = new HashMap<>();
                        ok.put("status", respuesta);
                        ok.put("rol", u.getRol());
                        return new ResponseEntity<>(ok, HttpStatus.OK);
                    }

                    Map<String, String> error = new HashMap<>();
                    error.put("status", "ERROR_PASSWORD");
                    error.put("rol", "");
                    return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
                })
                .orElseGet(() -> {
                    Map<String, String> noEncontrado = new HashMap<>();
                    noEncontrado.put("status", "USUARIO_NO_ENCONTRADO");
                    noEncontrado.put("rol", "");
                    return new ResponseEntity<>(noEncontrado, HttpStatus.NOT_FOUND);
                });
    }
}