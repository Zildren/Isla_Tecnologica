package com.example.demo.controller;

import com.example.demo.model.Empresa;
import com.example.demo.model.Producto;
import com.example.demo.repository.ProductoRepository;
import com.example.demo.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private JwtService jwtService;

    // Extrae empresaId del JWT automáticamente
    private Long getEmpresaId(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        String token = auth.substring(7);
        return jwtService.extraerEmpresaId(token);
    }

    @GetMapping
    public List<Producto> obtenerTodos(HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);
        return productoRepository.findByEmpresaId(empresaId);
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Producto producto,
                                   HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);

        Empresa empresa = new Empresa();
        empresa.setId(empresaId);
        producto.setEmpresa(empresa);

        return ResponseEntity.ok(productoRepository.save(producto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id,
                                        @RequestBody Producto producto,
                                        HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);

        return productoRepository.findByIdAndEmpresaId(id, empresaId)
            .map(existing -> {
                existing.setCodigo(producto.getCodigo());
                existing.setNombre(producto.getNombre());
                existing.setStock(producto.getStock());
                existing.setPrecioCompra(producto.getPrecioCompra());
                existing.setPrecioVenta(producto.getPrecioVenta());
                existing.setCategoria(producto.getCategoria());
                existing.setImagen(producto.getImagen());
                return ResponseEntity.ok(productoRepository.save(existing));
            }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/descontar")
    public ResponseEntity<?> descontarStock(@PathVariable Long id,
                                            @RequestParam Integer cantidad,
                                            HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);

        return productoRepository.findByIdAndEmpresaId(id, empresaId)
            .map(producto -> {
                if (producto.getStock() < cantidad) {
                    return ResponseEntity.badRequest()
                        .body("No hay suficiente stock de " + producto.getNombre());
                }
                producto.setStock(producto.getStock() - cantidad);
                return ResponseEntity.ok(productoRepository.save(producto));
            }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id,
                                      HttpServletRequest request) {
        Long empresaId = getEmpresaId(request);

        return productoRepository.findByIdAndEmpresaId(id, empresaId)
            .map(producto -> {
                productoRepository.delete(producto);
                return ResponseEntity.ok().body("Producto eliminado correctamente");
            }).orElse(ResponseEntity.notFound().build());
    }
}