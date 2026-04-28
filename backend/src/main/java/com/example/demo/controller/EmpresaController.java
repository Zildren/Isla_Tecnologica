package com.example.demo.controller;

import com.example.demo.model.Empresa;
import com.example.demo.service.EmpresaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/empresas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmpresaController {

    private final EmpresaService service;

    @GetMapping
    public List<Empresa> getAll() {
        return service.findAll();
    }

    @PostMapping
    public ResponseEntity<Empresa> create(@RequestBody Empresa body) {
        return ResponseEntity.ok(service.save(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Empresa> update(@PathVariable Long id, @RequestBody Empresa body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}