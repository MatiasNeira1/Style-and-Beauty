package com.style.beauty.ms_auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class config {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // esto lo tengo que desactivar para poder usar Postman 
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/crear-usuario").permitAll()
                .requestMatchers("/api/auth/asignar-rol").permitAll()
                .requestMatchers("/api/auth/registrar-cliente").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()// Esta ruta es publica
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
}
