package com.example.demo.controller;

import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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

                // 🔄 Migración automática: si la contraseña NO está encriptada, la comparamos
                // en texto plano y la encriptamos para la próxima vez
                boolean passwordCorrecta;
                if (u.getPassword().startsWith("$2a$") || u.getPassword().startsWith("$2b$")) {
                    // Ya está encriptada con BCrypt
                    passwordCorrecta = passwordEncoder.matches(password, u.getPassword());
                } else {
                    // Todavía en texto plano — comparamos directo y migramos
                    passwordCorrecta = u.getPassword().trim().equals(password);
                    if (passwordCorrecta) {
                        u.setPassword(passwordEncoder.encode(password));
                        usuarioRepository.save(u);
                        System.out.println("✅ Contraseña migrada a BCrypt: " + matricula);
                    }
                }

                if (!passwordCorrecta) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("status", "ERROR_PASSWORD");
                    return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
                }

                if (Boolean.TRUE.equals(u.getBloqueado())) {
                    Map<String, Object> bloqueado = new HashMap<>();
                    bloqueado.put("status", "BLOQUEADO");
                    return new ResponseEntity<>(bloqueado, HttpStatus.FORBIDDEN);
                }

                // ✅ Generar JWT
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

                return new ResponseEntity<>(ok, HttpStatus.OK);
            })
            .orElseGet(() -> {
                Map<String, Object> noEncontrado = new HashMap<>();
                noEncontrado.put("status", "USUARIO_NO_ENCONTRADO");
                return new ResponseEntity<>(noEncontrado, HttpStatus.NOT_FOUND);
            });
    }
}