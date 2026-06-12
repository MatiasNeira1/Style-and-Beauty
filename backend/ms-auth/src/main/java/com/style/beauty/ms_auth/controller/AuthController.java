package com.style.beauty.ms_auth.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
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

    @PostMapping("/crear-usuario")
    public ResponseEntity<?> crearUsuario(@RequestBody Map<String, String> requestBody, HttpServletRequest httpRequest) {
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

        String email = requestBody.get("email");
        String password = requestBody.get("password");
        String rol = requestBody.get("rol");

        if (email == null || email.isBlank() || password == null || password.isBlank() || rol == null || rol.isBlank()) {
            return ResponseEntity.badRequest().body("Faltan parametros: 'email', 'password' o 'rol'");
        }

        try {
            UserRecord user = rolService.createUserWithRole(email, password, rol.toUpperCase());
            return ResponseEntity.ok(Map.of(
                    "uid", user.getUid(),
                    "email", user.getEmail(),
                    "rol", rol.toUpperCase()
            ));
        } catch (FirebaseAuthException e) {
            String message = e.getMessage() == null ? "" : e.getMessage();
            if (message.contains("EMAIL_EXISTS") || message.toLowerCase().contains("already exists")) {
                return ResponseEntity.badRequest().body("Ya existe un usuario con ese correo.");
            }
            return ResponseEntity.internalServerError().body("Error al crear usuario en Firebase: " + message);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Rol invalido: " + e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(503).body(e.getMessage());
        }
    }

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
        } catch (IllegalStateException e) {
            return ResponseEntity.status(503).body(e.getMessage());
        }
    }
//===============================================================================================================================
    @PostMapping("/registrar-cliente")
    public ResponseEntity<String> registrarClienteAutomatico(@RequestBody Map<String, String> requestBody) {
        String uid = requestBody.get("uid");

        if (uid == null || uid.isEmpty()) {
            return ResponseEntity.badRequest().body("Falta el parámetro 'uid'");
        }

        try {
            // Asignacion de usuario cliente por defecto al registrarse
            rolService.assignRoleToUser(uid, "CLIENTE");
            return ResponseEntity.ok("Rol CLIENTE asignado exitosamente al nuevo usuario");
        } catch (FirebaseAuthException e) {
            return ResponseEntity.internalServerError().body("Error al comunicar con Firebase: " + e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(503).body(e.getMessage());
        }
    }
}
