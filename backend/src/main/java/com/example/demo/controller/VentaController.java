package com.example.demo.controller;

import com.example.demo.model.Venta;
import com.example.demo.model.Producto;
import com.example.demo.repository.VentaRepository;
import com.example.demo.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Collections;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @GetMapping
    public List<Venta> obtenerTodasLasVentas() {
        try {
            List<Venta> ventas = ventaRepository.findAll();
            Collections.reverse(ventas);
            return ventas;
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @PostMapping
    public ResponseEntity<?> registrarVenta(@RequestBody Venta venta) {
        try {
            Producto producto = productoRepository.findByCodigo(venta.getCodigoProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + venta.getCodigoProducto()));

            if (producto.getStock() < venta.getCantidad()) {
                return ResponseEntity.badRequest().body("Stock insuficiente. Disponible: " + producto.getStock());
            }

            producto.setStock(producto.getStock() - venta.getCantidad());
            productoRepository.save(producto);

            double costoBase = (producto.getPrecioCompra() != null && producto.getPrecioCompra() > 0)
                    ? producto.getPrecioCompra()
                    : 0.0;
            venta.setPrecioCompra(costoBase);

            System.out.println(">>> [VENTA] Producto: " + producto.getCodigo()
                    + " | precioCompra: " + costoBase
                    + " | precioVenta: " + producto.getPrecioVenta()
                    + " | cantidad: " + venta.getCantidad());

            if (venta.getPrecioVenta() == null || venta.getPrecioVenta() <= 0) {
                venta.setPrecioVenta(producto.getPrecioVenta());
            }

            venta.setTotal(venta.getCantidad() * venta.getPrecioVenta());

            Venta nuevaVenta = ventaRepository.save(venta);
            return ResponseEntity.ok(nuevaVenta);

        } catch (Exception e) {
            System.err.println(">>> [ERROR] " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error en el servidor: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarVenta(@PathVariable Long id) {
        try {
            if (!ventaRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            ventaRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println(">>> [ERROR al eliminar venta] " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error al eliminar la venta: " + e.getMessage());
        }
    }
}