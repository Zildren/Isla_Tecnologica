package com.example.demo.controller;

import com.example.demo.model.Producto;
import com.example.demo.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
// 🟢 CRÍTICO: Permite que tu app de React (puerto 3000) se conecte a Spring (8080)
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
        // Tip: Aquí podrías setear una fecha de creación por defecto si no viene del front
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
            
            // Si añadiste este campo en tu modelo Producto.java, descomenta la siguiente línea:
            // existing.setUltimaModificacionPor(producto.getRegistradoPorMatricula());
            
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
        try {
            if (!productoRepository.existsById(id)) {
                return ResponseEntity.status(404).body("El producto con ID " + id + " no existe.");
            }
            productoRepository.deleteById(id);
            // Retornamos 200 OK con un mensaje para que el 'alert' de React sea más informativo
            return ResponseEntity.ok().body("Producto eliminado correctamente");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al eliminar: " + e.getMessage());
        }
    }
}