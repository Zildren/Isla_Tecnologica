// backend/src/main/java/com/example/demo/repository/ProductoRepository.java
package com.example.demo.repository;

import com.example.demo.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional; // Asegúrate de tener este import

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    // ESTO QUITA EL ERROR ROJO DE TU CONTROLADOR
    Optional<Producto> findByCodigo(String codigo); 
}