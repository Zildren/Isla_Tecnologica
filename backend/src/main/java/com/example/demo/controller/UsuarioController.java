package com.example.demo.controller;

import com.example.demo.model.Empresa;
import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // 🔑 Helper JWT
    private Long getEmpresaId(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) throw new RuntimeException("Token no encontrado");
        return jwtService.extraerEmpresaId(auth.substring(7));
    }

    // ✅ GET /api/usuarios — filtra por empresa del JWT
    @GetMapping
    public List<Usuario> obtenerPorEmpresa(HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);
        return usuarioRepository.findByEmpresaId(empresaId);
    }

    // ✅ POST /api/usuarios — asigna empresa desde JWT
    @PostMapping
    public ResponseEntity<?> agregar(@RequestBody Usuario usuario,
                                     HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);

        // Matrícula única por empresa
        if (usuarioRepository.findByMatriculaAndEmpresaId(usuario.getMatricula(), empresaId).isPresent()) {
            return ResponseEntity.badRequest().body("Ya existe un usuario con esa matrícula en tu empresa.");
        }

        // Límite de usuarios
        long totalUsuarios = usuarioRepository.countByEmpresaId(empresaId);
        Empresa empresa = new Empresa();
        empresa.setId(empresaId);

        // Encriptar contraseña
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        usuario.setEmpresa(empresa);
        if (usuario.getBloqueado() == null) usuario.setBloqueado(false);

        return ResponseEntity.ok(usuarioRepository.save(usuario));
    }

    // ✅ PUT /api/usuarios/{id}/bloquear
    @PutMapping("/{id}/bloquear")
    public ResponseEntity<?> toggleBloqueo(@PathVariable Long id,
                                           @RequestBody Map<String, Boolean> body,
                                           HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);
        return usuarioRepository.findById(id).map(u -> {
            // Verificar que el usuario pertenece a la empresa
            if (!u.getEmpresa().getId().equals(empresaId)) {
                return ResponseEntity.status(403).body("No autorizado");
            }
            if (body.containsKey("bloqueado")) {
                u.setBloqueado(body.get("bloqueado"));
                return ResponseEntity.ok(usuarioRepository.save(u));
            }
            return ResponseEntity.badRequest().body("Falta el campo 'bloqueado'");
        }).orElse(ResponseEntity.notFound().build());
    }

    // ✅ DELETE /api/usuarios/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id,
                                      HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);
        try {
            return usuarioRepository.findById(id).map(u -> {
                if (!u.getEmpresa().getId().equals(empresaId)) {
                    return ResponseEntity.status(403).body("No autorizado");
                }
                usuarioRepository.deleteById(id);
                return ResponseEntity.ok().body(Map.of("message", "Usuario eliminado correctamente"));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al eliminar: " + e.getMessage());
        }
    }
}