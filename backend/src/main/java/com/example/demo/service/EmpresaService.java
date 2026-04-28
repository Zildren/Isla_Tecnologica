package com.example.demo.service;

import com.example.demo.dto.CrearEmpresaRequest;
import com.example.demo.model.Empresa;
import com.example.demo.model.Usuario;
import com.example.demo.repository.EmpresaRepository;
import com.example.demo.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmpresaService {

    private final EmpresaRepository empresaRepo;
    private final UsuarioRepository usuarioRepo;
    private final PasswordEncoder passwordEncoder;

    public List<Empresa> findAll() {
        return empresaRepo.findAll();
    }

    @Transactional
    public Empresa crearConAdmin(CrearEmpresaRequest req) {

        // 1️⃣ Validar que el usuario no exista ya
        if (usuarioRepo.existsByMatricula(req.getAdminUser())) {
            throw new RuntimeException("El usuario '" + req.getAdminUser() + "' ya existe");
        }

        // 2️⃣ Crear la empresa
        Empresa empresa = new Empresa();
        empresa.setNombre(req.getNombre());
        empresa.setPropietario(req.getPropietario());
        empresa.setTelefono(req.getTelefono());
        empresa.setEmail(req.getEmail());
        empresa.setPlan(req.getPlan() != null ? req.getPlan() : "FREE");
        empresa.setActivo(true);

        if (req.getFechaVencimiento() != null && !req.getFechaVencimiento().isBlank()) {
            empresa.setFechaVencimiento(LocalDate.parse(req.getFechaVencimiento()));
        }

        // Límites según plan
        switch (empresa.getPlan()) {
            case "BASIC"      -> { empresa.setLimiteProductos(200);  empresa.setLimiteUsuarios(5); }
            case "PRO"        -> { empresa.setLimiteProductos(1000); empresa.setLimiteUsuarios(15); }
            case "ENTERPRISE" -> { empresa.setLimiteProductos(9999); empresa.setLimiteUsuarios(9999); }
            default           -> { empresa.setLimiteProductos(100);  empresa.setLimiteUsuarios(3); }
        }

        Empresa empresaGuardada = empresaRepo.save(empresa);

        // 3️⃣ Crear el usuario admin ligado a esa empresa
        Usuario admin = new Usuario();
        admin.setMatricula(req.getAdminUser());
        admin.setPassword(passwordEncoder.encode(req.getAdminPass()));
        admin.setRol("ADMIN");
        admin.setBloqueado(false);
        admin.setEmpresa(empresaGuardada);

        usuarioRepo.save(admin);

        return empresaGuardada;
    }

    public Empresa update(Long id, Empresa body) {
        Empresa existing = empresaRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada: " + id));
        existing.setNombre(body.getNombre());
        existing.setPropietario(body.getPropietario());
        existing.setTelefono(body.getTelefono());
        existing.setEmail(body.getEmail());
        existing.setPlan(body.getPlan());
        existing.setActivo(body.getActivo());
        existing.setFechaVencimiento(body.getFechaVencimiento());
        return empresaRepo.save(existing);
    }

    public void delete(Long id) {
        empresaRepo.deleteById(id);
    }
}