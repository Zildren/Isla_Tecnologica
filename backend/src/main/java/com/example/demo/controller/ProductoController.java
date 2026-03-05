package com.example.demo.controller;

import com.example.demo.model.Producto;
import com.example.demo.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity; // Importante para manejar respuestas

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "http://localhost:3000")
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

    // --- NUEVA RUTA PARA DESCONTAR STOCK ---
    // Esta ruta la usaremos cuando registres una venta en Isla Tecnológica
    @PutMapping("/{id}/descontar")
    public ResponseEntity<?> descontarStock(@PathVariable Long id, @RequestParam Integer cantidad) {
        return productoRepository.findById(id).map(producto -> {
            if (producto.getStock() < cantidad) {
                return ResponseEntity.badRequest().body("No hay suficiente stock de " + producto.getNombre());
            }
            
            producto.setStock(producto.getStock() - cantidad);
            productoRepository.save(producto);
            return ResponseEntity.ok(producto);
        }).orElse(ResponseEntity.notFound().build());
    }
}