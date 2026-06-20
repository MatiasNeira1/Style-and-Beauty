package com.style.beauty.ms_auth.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.UserRecord.CreateRequest;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.FirebaseApp;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RolService {
    private static final Logger logger = LoggerFactory.getLogger(RolService.class);

    public UserRecord createUserWithRole(String email, String password, String rol) throws FirebaseAuthException {
        ensureFirebaseConfigured();
        if (!Roles.isValid(rol)) {
            throw new IllegalArgumentException("Rol no permitido: " + rol);
        }

        CreateRequest request = new CreateRequest()
                .setEmail(email)
                .setPassword(password)
                .setEmailVerified(false)
                .setDisabled(false);

        UserRecord user;
        try {
            user = FirebaseAuth.getInstance().createUser(request);
        } catch (FirebaseAuthException e) {
            if (e.getAuthErrorCode() != AuthErrorCode.EMAIL_ALREADY_EXISTS) {
                throw e;
            }
            user = FirebaseAuth.getInstance().getUserByEmail(email.trim().toLowerCase());
            logger.info("Usuario Firebase ya existia; se reutilizara para rol {}: {}", rol, user.getUid());
        }
        assignRoleToUser(user.getUid(), rol);
        logger.info("Usuario Firebase creado con rol {}: {}", rol, user.getUid());
        return user;
    }

    /**
     * @param uid Este id lo genera firebase cuando se crea un usuario
     * @param rol El rol a asignar ("STAFF", "CLIENTE", "ADMIN")
     */
    public void assignRoleToUser(String uid, String rol) throws FirebaseAuthException {
        ensureFirebaseConfigured();
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
        existingClaims.put("role", rol);

        FirebaseAuth.getInstance().setCustomUserClaims(uid, existingClaims);

        logger.info("Rol {} asignado correctamente al UID: {}", rol, uid);

        // Guardar/Actualizar documento en Firestore
        saveUserToFirestore(user, rol);
    }

    public UserRecord createOrConfirmPublicClient(String email, String password) throws FirebaseAuthException {
        ensureFirebaseConfigured();

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("Email y password son obligatorios para registrar cliente.");
        }

        try {
            CreateRequest request = new CreateRequest()
                    .setEmail(email.trim().toLowerCase())
                    .setPassword(password)
                    .setEmailVerified(false)
                    .setDisabled(false);

            UserRecord user = FirebaseAuth.getInstance().createUser(request);
            return assignClientRoleFromPublicFlow(user.getUid());
        } catch (FirebaseAuthException e) {
            if (e.getAuthErrorCode() == AuthErrorCode.EMAIL_ALREADY_EXISTS) {
                UserRecord existingUser = FirebaseAuth.getInstance().getUserByEmail(email.trim().toLowerCase());
                return assignClientRoleFromPublicFlow(existingUser.getUid());
            }
            throw e;
        }
    }

    public UserRecord assignClientRoleFromPublicFlow(String uid) throws FirebaseAuthException {
        ensureFirebaseConfigured();

        UserRecord user;
        try {
            user = FirebaseAuth.getInstance().getUser(uid);
        } catch (FirebaseAuthException e) {
            logger.warn("Usuario no encontrado: {}", uid);
            throw e;
        }

        Map<String, Object> existingClaims = user.getCustomClaims() != null
                ? new HashMap<>(user.getCustomClaims())
                : new HashMap<>();
        Object currentRole = existingClaims.getOrDefault("rol", existingClaims.get("role"));

        if (currentRole != null && !"CLIENTE".equalsIgnoreCase(String.valueOf(currentRole))) {
            throw new IllegalArgumentException("El usuario ya tiene un rol protegido asignado.");
        }

        existingClaims.put("rol", "CLIENTE");
        existingClaims.put("role", "CLIENTE");
        FirebaseAuth.getInstance().setCustomUserClaims(uid, existingClaims);

        logger.info("Rol CLIENTE confirmado para UID desde flujo publico: {}", uid);

        // Guardar/Actualizar documento en Firestore
        saveUserToFirestore(user, "CLIENTE");

        return FirebaseAuth.getInstance().getUser(uid);
    }

    private void saveUserToFirestore(UserRecord user, String rol) {
        try {
            Firestore firestore = FirestoreClient.getFirestore();
            Map<String, Object> userData = new HashMap<>();
            userData.put("email", user.getEmail() != null ? user.getEmail().trim().toLowerCase() : "");
            userData.put("rol", rol.toLowerCase());

            firestore.collection("usuarios").document(user.getUid()).set(userData).get();
            logger.info("Documento Firestore creado/actualizado en usuarios/{} con rol {}", user.getUid(), rol.toLowerCase());
        } catch (Exception e) {
            logger.error("Error al guardar documento en Firestore para UID {}: {}", user.getUid(), e.getMessage());
        }
    }

    private void ensureFirebaseConfigured() {
        try {
            FirebaseApp.getInstance();
        } catch (IllegalStateException e) {
            throw new IllegalStateException("Firebase Admin SDK no esta configurado en el servidor.");
        }
    }
}
