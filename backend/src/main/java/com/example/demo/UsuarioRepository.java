package com.example.demo;

import com.example.demo.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // 🔥 Obtener usuarios por empresa
    List<Usuario> findByEmpresaId(Long empresaId);

    // 🔥 Contar usuarios por empresa (para límites de plan)
    long countByEmpresaId(Long empresaId);

    // 🔒 Validar matrícula dentro de la misma empresa
    Optional<Usuario> findByMatriculaAndEmpresaId(String matricula, Long empresaId);
}