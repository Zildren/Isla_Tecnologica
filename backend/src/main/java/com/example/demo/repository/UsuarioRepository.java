package com.example.demo.repository;

import com.example.demo.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByMatricula(String matricula);

    List<Usuario> findByEmpresaId(Long empresaId);

    long countByEmpresaId(Long empresaId);

    Optional<Usuario> findByMatriculaAndEmpresaId(String matricula, Long empresaId);
}