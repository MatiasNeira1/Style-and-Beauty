package com.style.beauty.ms_auth.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.style.beauty.ms_auth.controller.RoleRequest;
import com.style.beauty.ms_auth.service.RolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private RolService rolService;

    @PostMapping("/asignar-rol")
    public ResponseEntity<String> asignarRol(@Valid @RequestBody RoleRequest requestBody, HttpServletRequest httpRequest) {
        // Verificar que la request fue autenticada por el interceptor y obtener claims
       Object claimsObj = httpRequest.getAttribute("firebaseClaims");
        if (!(claimsObj instanceof Map)) {
            return ResponseEntity.status(401).body("No autenticado");
       }

        @SuppressWarnings("unchecked")
        Map<String, Object> claims = (Map<String, Object>) claimsObj;
        Object callerRole = claims.get("rol");
        if (callerRole == null || !"ADMIN".equals(String.valueOf(callerRole))) {
            return ResponseEntity.status(403).body("Acceso denegado: se requiere rol ADMIN");
        }

        String uid = requestBody.getUid();
        String rol = requestBody.getRol();

        if (uid == null || rol == null) {
            return ResponseEntity.badRequest().body("Faltan parámetros: 'uid' o 'rol'");
        }

        try {
            rolService.assignRoleToUser(uid, rol.toUpperCase());
            return ResponseEntity.ok("Rol asignado exitosamente en Firebase");
        } catch (FirebaseAuthException e) {
            return ResponseEntity.internalServerError().body("Error al comunicar con Firebase: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Rol inválido: " + e.getMessage());
        }
    }
}
