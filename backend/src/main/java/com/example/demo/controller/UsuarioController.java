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

    @GetMapping
    public List<Usuario> obtenerTodos() {
        return usuarioRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> agregar(@RequestBody Usuario usuario) {
        if (usuarioRepository.findByMatricula(usuario.getMatricula()).isPresent()) {
            return ResponseEntity.badRequest().body("Ya existe un usuario con esa matrícula.");
        }
        if (usuario.getBloqueado() == null) {
            usuario.setBloqueado(false);
        }
        return ResponseEntity.ok(usuarioRepository.save(usuario));
    }

    @PutMapping("/{id}/bloquear")
    public ResponseEntity<?> toggleBloqueo(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return usuarioRepository.findById(id).map(u -> {
            if (body.containsKey("bloqueado")) {
                u.setBloqueado(body.get("bloqueado"));
                return ResponseEntity.ok(usuarioRepository.save(u));
            }
            return ResponseEntity.badRequest().body("Falta el campo 'bloqueado' en el cuerpo de la petición.");
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            if (!usuarioRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            usuarioRepository.deleteById(id);
            return ResponseEntity.ok().body(Map.of("message", "Usuario eliminado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al eliminar usuario: " + e.getMessage());
        }
    }
}