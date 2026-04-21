package com.example.demo.repository;

import com.example.demo.model.Abono;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AbonoRepository extends JpaRepository<Abono, Long> {

    Optional<Abono> findByIdAndClienteEmpresaId(Long id, Long empresaId);

    List<Abono> findByClienteIdOrderByFechaDescHoraDesc(Long clienteId);
}