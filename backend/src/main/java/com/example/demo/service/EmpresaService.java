package com.example.demo.service;

import com.example.demo.model.Empresa;
import com.example.demo.repository.EmpresaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmpresaService {

    private final EmpresaRepository repo;

    public List<Empresa> findAll() {
        return repo.findAll();
    }

    public Empresa save(Empresa e) {
        // Asignar límites según plan al crear/actualizar
        switch (e.getPlan() != null ? e.getPlan() : "FREE") {
            case "BASIC"      -> { e.setLimiteProductos(200);  e.setLimiteUsuarios(5); }
            case "PRO"        -> { e.setLimiteProductos(1000); e.setLimiteUsuarios(15); }
            case "ENTERPRISE" -> { e.setLimiteProductos(9999); e.setLimiteUsuarios(9999); }
            default           -> { e.setLimiteProductos(100);  e.setLimiteUsuarios(3); } // FREE
        }
        return repo.save(e);
    }

    public Empresa update(Long id, Empresa body) {
        Empresa existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada: " + id));
        existing.setNombre(body.getNombre());
        existing.setPropietario(body.getPropietario());
        existing.setTelefono(body.getTelefono());
        existing.setEmail(body.getEmail());
        existing.setPlan(body.getPlan());
        existing.setActivo(body.getActivo());
        existing.setFechaVencimiento(body.getFechaVencimiento());
        return save(existing);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}