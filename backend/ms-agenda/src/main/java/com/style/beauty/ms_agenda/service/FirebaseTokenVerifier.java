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

    public String authenticatedUid(String authHeader) {
        return authenticatedToken(authHeader).getUid();
    }

    public String authenticatedAdminUid(String authHeader) {
        FirebaseToken token = authenticatedToken(authHeader);
        Object roleClaim = token.getClaims().getOrDefault("rol", token.getClaims().get("role"));

        if (roleClaim == null || !"ADMIN".equalsIgnoreCase(String.valueOf(roleClaim))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo administradores autenticados pueden crear reservas desde el panel.");
        }

        return token.getUid();
    }

    public String authenticatedClientUid(String authHeader) {
        FirebaseToken token = authenticatedToken(authHeader);
        Object roleClaim = token.getClaims().getOrDefault("rol", token.getClaims().get("role"));

        if (roleClaim != null && !"CLIENTE".equalsIgnoreCase(String.valueOf(roleClaim))) {
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
}
