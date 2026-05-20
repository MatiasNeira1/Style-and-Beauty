package com.style.beauty.ms_auth.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RolService {
    private static final Logger logger = LoggerFactory.getLogger(RolService.class);

    /**
     * @param uid Este id lo genera firebase cuando se crea un usuario
     * @param rol El rol a asignar ("STAFF", "CLIENTE", "ADMIN")
     */
    public void assignRoleToUser(String uid, String rol) throws FirebaseAuthException {
        // Validar rol permitido
        if (!Roles.isValid(rol)) {
            throw new IllegalArgumentException("Rol no permitido: " + rol);
        }

        // Verificar que el usuario exista
        UserRecord user;
        try {
            user = FirebaseAuth.getInstance().getUser(uid);
        } catch (FirebaseAuthException e) {
            logger.warn("Usuario no encontrado: {}", uid);
            throw e;
        }

        // Obtener claims existentes y hacer merge para no sobrescribir otros claims
        Map<String, Object> existingClaims = user.getCustomClaims() != null
                ? new HashMap<>(user.getCustomClaims())
                : new HashMap<>();

        existingClaims.put("rol", rol);

        FirebaseAuth.getInstance().setCustomUserClaims(uid, existingClaims);

        logger.info("Rol {} asignado correctamente al UID: {}", rol, uid);
    }
}

