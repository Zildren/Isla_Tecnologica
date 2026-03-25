package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 1. SOLUCIÓN AL ERROR 404 (Página Blanca al dar F5)
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Redirige cualquier ruta que no sea un archivo (como .js o .css) al index.html
        // Esto permite que React maneje las rutas aunque refresques la página
        registry.addViewController("/{path:[^\\.]*}")
                .setViewName("forward:/index.html");
    }

    // 2. SOLUCIÓN AL ERROR 403 (Invalid CORS request / No guarda productos)
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(
                    "http://localhost:3000", 
                    "http://localhost:8080",
                    "https://*.railway.app" // PERMITE CUALQUIER SUBDOMINIO DE RAILWAY (CELULARES)
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}