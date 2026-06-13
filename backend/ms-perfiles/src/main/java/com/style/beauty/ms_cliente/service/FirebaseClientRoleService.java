package com.style.beauty.ms_cliente.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@Service
public class FirebaseClientRoleService {

    public void ensureClientRoleForPublicProfile(String uid) {
        if (uid == null || uid.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No fue posible identificar al usuario autenticado.");
        }

        try {
            FirebaseApp.getInstance();
            UserRecord user = FirebaseAuth.getInstance().getUser(uid);
            Map<String, Object> claims = user.getCustomClaims() != null
                    ? new HashMap<>(user.getCustomClaims())
                    : new HashMap<>();

            Object currentRole = claims.getOrDefault("rol", claims.get("role"));
            if (currentRole != null && !"CLIENTE".equalsIgnoreCase(String.valueOf(currentRole))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario ya tiene un rol protegido asignado.");
            }

            claims.put("rol", "CLIENTE");
            claims.put("role", "CLIENTE");
            FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
        } catch (FirebaseAuthException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No fue posible confirmar el rol CLIENTE en Firebase.");
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Firebase Admin SDK no esta configurado en el servidor.");
        }
    }
}
