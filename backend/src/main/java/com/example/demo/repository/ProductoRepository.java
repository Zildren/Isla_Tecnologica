package com.example.demo.repository;

import com.example.demo.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    Optional<Producto> findByCodigo(String codigo);

    List<Producto> findByEmpresaId(Long empresaId);

    long countByEmpresaId(Long empresaId);

    Optional<Producto> findByIdAndEmpresaId(Long id, Long empresaId);
}