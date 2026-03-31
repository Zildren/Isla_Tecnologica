package com.example.demo.repository;

import com.example.demo.model.Empresa;
import com.example.demo.model.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GastoRepository extends JpaRepository<Gasto, Long> {
    List<Gasto> findByEmpresaOrderByCreadoEnDesc(Empresa empresa);
}