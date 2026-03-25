package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // ✅ Permitir todos los subdominios (ideal para Railway y desarrollo)
        config.setAllowedOriginPatterns(Arrays.asList(
                "https://*.railway.app",
                "http://localhost:*"
        ));

        // ✅ Métodos permitidos
        config.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));

        // ✅ Headers permitidos
        config.setAllowedHeaders(Arrays.asList("*"));

        // ✅ Permitir cookies / auth
        config.setAllowCredentials(true);

        // ✅ Tiempo de cache del preflight
        config.setMaxAge(3600L);

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}