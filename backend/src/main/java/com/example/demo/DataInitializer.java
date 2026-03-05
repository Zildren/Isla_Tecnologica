package com.example.demo;

import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer {

    @Bean
    CommandLineRunner init(UsuarioRepository repository) {
        return args -> {
            if (repository.findByMatricula("riempy").isEmpty()) {
                Usuario admin = new Usuario();
                admin.setMatricula("riempy");
                admin.setPassword("admin123"); // Tu clave temporal
                admin.setRol("ADMIN");
                repository.save(admin);
                System.out.println("✅ ACCESO TOTAL: Usuario 'riempy' creado con éxito.");
            }
        };
    }
}