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
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    // GET - listar todos
    @GetMapping
    public List<Usuario> obtenerTodos() {
        return usuarioRepository.findAll();
    }

    // POST - agregar usuario
    @PostMapping
    public ResponseEntity<?> agregar(@RequestBody Usuario usuario) {
        if (usuarioRepository.findByMatricula(usuario.getMatricula()).isPresent()) {
            return ResponseEntity.badRequest().body("Ya existe un usuario con esa matrícula.");
        }
        usuario.setBloqueado(false);
        return ResponseEntity.ok(usuarioRepository.save(usuario));
    }

    // PUT - bloquear/desbloquear
    @PutMapping("/{id}/bloquear")
    public ResponseEntity<?> toggleBloqueo(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return usuarioRepository.findById(id).map(u -> {
            u.setBloqueado(body.get("bloqueado"));
            return ResponseEntity.ok(usuarioRepository.save(u));
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE - eliminar usuario
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        usuarioRepository.deleteById(id);
        return ResponseEntity.ok("Usuario eliminado.");
    }
}