package com.example.demo.controller;

import com.example.demo.model.Empresa;
import com.example.demo.model.Gasto;
import com.example.demo.repository.GastoRepository;
import com.example.demo.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gastos")
public class GastoController {

    @Autowired
    private GastoRepository gastoRepository;

    @Autowired
    private JwtService jwtService;

    private Long getEmpresaId(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer "))
            throw new RuntimeException("Token no encontrado");
        return jwtService.extraerEmpresaId(auth.substring(7));
    }

    // GET /api/gastos — todos los gastos de la empresa
    @GetMapping
    public List<Gasto> obtenerGastos(HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);
        Empresa empresa = new Empresa();
        empresa.setId(empresaId);
        return gastoRepository.findByEmpresaOrderByCreadoEnDesc(empresa);
    }

    // POST /api/gastos — registrar gasto
    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Gasto gasto,
                                       HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);
        Empresa empresa = new Empresa();
        empresa.setId(empresaId);
        gasto.setEmpresa(empresa);
        return ResponseEntity.ok(gastoRepository.save(gasto));
    }

    // PUT /api/gastos/{id} — editar gasto
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id,
                                        @RequestBody Gasto datos,
                                        HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);
        return gastoRepository.findById(id).map(g -> {
            if (!g.getEmpresa().getId().equals(empresaId))
                return ResponseEntity.status(403).body("No autorizado");
            g.setDescripcion(datos.getDescripcion());
            g.setMonto(datos.getMonto());
            g.setCategoria(datos.getCategoria());
            g.setFecha(datos.getFecha());
            return ResponseEntity.ok(gastoRepository.save(g));
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/gastos/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id,
                                      HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);
        return gastoRepository.findById(id).map(g -> {
            if (!g.getEmpresa().getId().equals(empresaId))
                return ResponseEntity.status(403).body("No autorizado");
            gastoRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Gasto eliminado"));
        }).orElse(ResponseEntity.notFound().build());
    }
}