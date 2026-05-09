package com.style.beauty.ms_auth.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.style.beauty.ms_auth.service.RolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private RolService rolService;

    @PostMapping("/asignar-rol")
    public ResponseEntity<String> asignarRol(@RequestBody Map<String, String> request) {
        String uid = request.get("uid");
        String rol = request.get("rol");

        if (uid == null || rol == null) {
            return ResponseEntity.badRequest().body("Faltan parámetros: 'uid' o 'rol'");
        }

        try {
            rolService.assignRoleToUser(uid, rol.toUpperCase());
            return ResponseEntity.ok("Rol asignado exitosamente en Firebase");
        } catch (FirebaseAuthException e) {
            return ResponseEntity.internalServerError().body("Error al comunicar con Firebase: " + e.getMessage());
        }
    }
}
