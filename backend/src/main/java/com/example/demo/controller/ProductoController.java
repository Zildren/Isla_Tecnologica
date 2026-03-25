package com.example.demo.controller;

import com.example.demo.model.Producto;
import com.example.demo.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    @GetMapping
    public List<Producto> obtenerTodos() {
        return productoRepository.findAll();
    }

    @PostMapping
    public Producto crear(@RequestBody Producto producto) {
        return productoRepository.save(producto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Producto producto) {
        return productoRepository.findById(id).map(existing -> {
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
    public ResponseEntity<?> descontarStock(@PathVariable Long id, @RequestParam Integer cantidad) {
        return productoRepository.findById(id).map(producto -> {
            if (producto.getStock() < cantidad) {
                return ResponseEntity.badRequest().body("No hay suficiente stock de " + producto.getNombre());
            }
            producto.setStock(producto.getStock() - cantidad);
            return ResponseEntity.ok(productoRepository.save(producto));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        if (!productoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}