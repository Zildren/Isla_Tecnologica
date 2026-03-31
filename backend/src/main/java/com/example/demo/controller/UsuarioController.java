package com.example.demo.controller;

import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    // 🔥 OBTENER USUARIOS POR EMPRESA (ANTES ERA GLOBAL)
    @GetMapping("/empresa/{empresaId}")
    public List<Usuario> obtenerPorEmpresa(@PathVariable Long empresaId) {
        return usuarioRepository.findByEmpresaId(empresaId);
    }

    // 🔥 CREAR USUARIO CON VALIDACIÓN DE PLAN
    @PostMapping
    public ResponseEntity<?> agregar(@RequestBody Usuario usuario) {

        // Validar empresa
        if (usuario.getEmpresa() == null || usuario.getEmpresa().getId() == null) {
            return ResponseEntity.badRequest().body("El usuario debe pertenecer a una empresa.");
        }

        Long empresaId = usuario.getEmpresa().getId();

        // 🔒 Validar matrícula por empresa (NO global)
        if (usuarioRepository
                .findByMatriculaAndEmpresaId(usuario.getMatricula(), empresaId)
                .isPresent()) {
            return ResponseEntity.badRequest()
                    .body("Ya existe un usuario con esa matrícula en tu empresa.");
        }

        // 🔥 Validar límite de usuarios según plan
        long totalUsuarios = usuarioRepository.countByEmpresaId(empresaId);

        int limite = usuario.getEmpresa().getLimiteUsuarios();

        if (totalUsuarios >= limite) {
            return ResponseEntity.badRequest()
                    .body("Límite de usuarios alcanzado para tu plan.");
        }

        if (usuario.getBloqueado() == null) {
            usuario.setBloqueado(false);
        }

        return ResponseEntity.ok(usuarioRepository.save(usuario));
    }

    // 🔒 BLOQUEAR SOLO SI ES DE LA MISMA EMPRESA (SEGURIDAD)
    @PutMapping("/{id}/bloquear")
    public ResponseEntity<?> toggleBloqueo(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return usuarioRepository.findById(id).map(u -> {

            if (body.containsKey("bloqueado")) {
                u.setBloqueado(body.get("bloqueado"));
                return ResponseEntity.ok(usuarioRepository.save(u));
            }

            return ResponseEntity.badRequest()
                    .body("Falta el campo 'bloqueado' en el cuerpo de la petición.");

        }).orElse(ResponseEntity.notFound().build());
    }

    // 🔥 ELIMINAR USUARIO
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            if (!usuarioRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            usuarioRepository.deleteById(id);

            return ResponseEntity.ok()
                    .body(Map.of("message", "Usuario eliminado correctamente"));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Error al eliminar usuario: " + e.getMessage());
        }
    }
}