package com.style.beauty.ms_agenda.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FirebaseTokenVerifier {

    public record AuthenticatedUser(String uid, String role) {
    }

    public AuthenticatedUser authenticatedUser(String authHeader) {
        FirebaseToken token = authenticatedToken(authHeader);
        return new AuthenticatedUser(token.getUid(), normalizedRole(token));
    }

    public String authenticatedUid(String authHeader) {
        return authenticatedToken(authHeader).getUid();
    }

    public String authenticatedAdminUid(String authHeader) {
        FirebaseToken token = authenticatedToken(authHeader);
        String roleClaim = normalizedRole(token);

        if (roleClaim == null || !"ADMIN".equalsIgnoreCase(roleClaim)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo administradores autenticados pueden crear reservas desde el panel.");
        }

        return token.getUid();
    }

    public String authenticatedClientUid(String authHeader) {
        FirebaseToken token = authenticatedToken(authHeader);
        String roleClaim = normalizedRole(token);

        if (roleClaim != null && !"CLIENTE".equalsIgnoreCase(roleClaim)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo clientes autenticados pueden crear reservas.");
        }

        return token.getUid();
    }

    private FirebaseToken authenticatedToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Falta el header Authorization.");
        }

        if (FirebaseApp.getApps().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Firebase Admin SDK no esta configurado en el servidor.");
        }

        try {
            return FirebaseAuth.getInstance().verifyIdToken(authHeader.substring(7).trim());
        } catch (FirebaseAuthException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalido o expirado.");
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Firebase Admin SDK no esta configurado en el servidor.");
        }
    }

    private String normalizedRole(FirebaseToken token) {
        Object roleClaim = token.getClaims().get("rol");
        String role = roleClaim == null ? "" : String.valueOf(roleClaim).trim();
        if (role.isBlank()) {
            Object fallbackClaim = token.getClaims().get("role");
            role = fallbackClaim == null ? "" : String.valueOf(fallbackClaim).trim();
        }
        if (role.isBlank()) {
            return null;
        }

        String normalized = role.toUpperCase();
        if ("ADMINISTRADOR".equals(normalized) || "ADMINISTRATOR".equals(normalized)) {
            return "ADMIN";
        }
        if ("CLIENT".equals(normalized)) {
            return "CLIENTE";
        }
        if ("PROFESIONAL".equals(normalized) || "PROFESSIONAL".equals(normalized)
                || "EMPLEADO".equals(normalized) || "EMPLOYEE".equals(normalized)) {
            return "STAFF";
        }
        return normalized;
    }
}
