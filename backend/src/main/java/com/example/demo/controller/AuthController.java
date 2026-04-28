package com.example.demo.controller;

import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {

        String matricula = body.getOrDefault("matricula", "").trim();
        String password  = body.getOrDefault("password", "").trim();

        System.out.println("--- INTENTO DE LOGIN ---");
        System.out.println("Matricula: [" + matricula + "]");

        return usuarioRepository.findByMatricula(matricula)
            .map(u -> {

                // 🔄 Migración automática de contraseña plana a BCrypt
                boolean passwordCorrecta;
                if (u.getPassword().startsWith("$2a$") || u.getPassword().startsWith("$2b$")) {
                    passwordCorrecta = passwordEncoder.matches(password, u.getPassword());
                } else {
                    passwordCorrecta = u.getPassword().trim().equals(password);
                    if (passwordCorrecta) {
                        u.setPassword(passwordEncoder.encode(password));
                        usuarioRepository.save(u);
                        System.out.println("✅ Contraseña migrada a BCrypt: " + matricula);
                    }
                }

                if (!passwordCorrecta) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("status", "ACCESO_DENEGADO");
                    error.put("error", "Usuario o contraseña incorrectos.");
                    return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
                }

                // ✅ Verificar si el usuario está bloqueado
                if (Boolean.TRUE.equals(u.getBloqueado())) {
                    Map<String, Object> bloqueado = new HashMap<>();
                    bloqueado.put("status", "ACCESO_DENEGADO");
                    bloqueado.put("error", "Tu cuenta está bloqueada. Contacta al administrador.");
                    return new ResponseEntity<>(bloqueado, HttpStatus.FORBIDDEN);
                }

                // ✅ Verificar si la empresa existe y está activa
                if (u.getEmpresa() == null || Boolean.FALSE.equals(u.getEmpresa().getActivo())) {
                    Map<String, Object> inactiva = new HashMap<>();
                    inactiva.put("status", "ACCESO_DENEGADO");
                    inactiva.put("error", "La empresa está inactiva. Contacta al administrador.");
                    return new ResponseEntity<>(inactiva, HttpStatus.FORBIDDEN);
                }

                // ✅ Verificar vencimiento del plan
                if (u.getEmpresa().getFechaVencimiento() != null) {
                    LocalDate hoy = LocalDate.now();
                    if (hoy.isAfter(u.getEmpresa().getFechaVencimiento())) {
                        Map<String, Object> vencida = new HashMap<>();
                        vencida.put("status", "ACCESO_DENEGADO");
                        vencida.put("error", "El plan de la empresa venció. Contacta al administrador.");
                        return new ResponseEntity<>(vencida, HttpStatus.FORBIDDEN);
                    }
                }

                // ✅ Generar JWT y responder
                String token = jwtService.generarToken(u);

                String statusRol = "ADMIN".equalsIgnoreCase(u.getRol())
                    ? "BIENVENIDO_ADMIN"
                    : "BIENVENIDO_VENDEDOR";

                Map<String, Object> ok = new HashMap<>();
                ok.put("status", statusRol);
                ok.put("token", token);
                ok.put("rol", u.getRol());
                ok.put("matricula", u.getMatricula());
                ok.put("empresaId", u.getEmpresa().getId());

                System.out.println("✅ Login exitoso: " + matricula + " | Rol: " + u.getRol());
                return new ResponseEntity<>(ok, HttpStatus.OK);
            })
            .orElseGet(() -> {
                Map<String, Object> noEncontrado = new HashMap<>();
                noEncontrado.put("status", "ACCESO_DENEGADO");
                noEncontrado.put("error", "Usuario o contraseña incorrectos.");
                return new ResponseEntity<>(noEncontrado, HttpStatus.UNAUTHORIZED);
            });
    }
}