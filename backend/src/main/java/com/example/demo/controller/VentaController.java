package com.example.demo.controller;

import com.example.demo.model.Venta;
import com.example.demo.model.Producto;
import com.example.demo.model.Usuario;
import com.example.demo.repository.VentaRepository;
import com.example.demo.repository.ProductoRepository;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.List;
import java.util.Collections;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public List<Venta> obtenerTodasLasVentas(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Usuario usuario = usuarioRepository.findByMatricula(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            List<Venta> ventas = ventaRepository.findByEmpresa(usuario.getEmpresa());
            Collections.reverse(ventas);
            return ventas;
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @PostMapping
    public ResponseEntity<?> registrarVenta(@RequestBody Venta venta,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Usuario usuario = usuarioRepository.findByMatricula(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            venta.setEmpresa(usuario.getEmpresa());

            boolean esLibre = "LIBRE".equals(venta.getCodigoProducto());

            if (esLibre) {
                // Producto libre: no toca inventario
                if (venta.getPrecioVenta() == null || venta.getPrecioVenta() <= 0) {
                    return ResponseEntity.badRequest().body("Precio inválido para producto libre");
                }
                if (venta.getPrecioCompra() == null) venta.setPrecioCompra(0.0);
                venta.setTotal(venta.getCantidad() * venta.getPrecioVenta());
                System.out.println(">>> [VENTA LIBRE] Nombre: " + venta.getNombreProducto()
                        + " | precioVenta: " + venta.getPrecioVenta()
                        + " | cantidad: " + venta.getCantidad());

            } else {
                // Producto de inventario: flujo normal
                Producto producto = productoRepository.findByCodigo(venta.getCodigoProducto())
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + venta.getCodigoProducto()));

                if (producto.getStock() < venta.getCantidad()) {
                    return ResponseEntity.badRequest().body("Stock insuficiente. Disponible: " + producto.getStock());
                }

                producto.setStock(producto.getStock() - venta.getCantidad());
                productoRepository.save(producto);

                double costoBase = (producto.getPrecioCompra() != null && producto.getPrecioCompra() > 0)
                        ? producto.getPrecioCompra() : 0.0;
                venta.setPrecioCompra(costoBase);

                if (venta.getPrecioVenta() == null || venta.getPrecioVenta() <= 0) {
                    venta.setPrecioVenta(producto.getPrecioVenta());
                }

                venta.setTotal(venta.getCantidad() * venta.getPrecioVenta());

                System.out.println(">>> [VENTA] Producto: " + producto.getCodigo()
                        + " | precioCompra: " + costoBase
                        + " | precioVenta: " + producto.getPrecioVenta()
                        + " | cantidad: " + venta.getCantidad());
            }

            Venta nuevaVenta = ventaRepository.save(venta);
            return ResponseEntity.ok(nuevaVenta);

        } catch (Exception e) {
            System.err.println(">>> [ERROR] " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error en el servidor: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarVenta(@PathVariable Long id,
                                           @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Usuario usuario = usuarioRepository.findByMatricula(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            Venta venta = ventaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

            if (!venta.getEmpresa().getId().equals(usuario.getEmpresa().getId())) {
                return ResponseEntity.status(403).body("No autorizado");
            }

            ventaRepository.deleteById(id);
            return ResponseEntity.noContent().build();

        } catch (Exception e) {
            System.err.println(">>> [ERROR al eliminar venta] " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error al eliminar la venta: " + e.getMessage());
        }
    }
}