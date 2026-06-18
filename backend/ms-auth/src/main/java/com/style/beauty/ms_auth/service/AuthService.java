package com.style.beauty.ms_auth.service;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserRecord.CreateRequest;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    /**
     * Crea un usuario de tipo STAFF en Firebase Authentication y persiste
     * su documento en la colección "usuarios" de Firestore.
     *
     * Al usar el Admin SDK, la operación se ejecuta en el backend sin
     * afectar la sesión del administrador que invoca la petición.
     *
     * @param email    correo electrónico del nuevo staff
     * @param password contraseña del nuevo staff
     * @return el UID del usuario recién creado
     * @throws FirebaseAuthException si Firebase rechaza la creación
     * @throws IllegalStateException si el Admin SDK no está inicializado
     */
    public String crearStaff(String email, String password) throws FirebaseAuthException {
        ensureFirebaseConfigured();

        // 1. Crear usuario en Firebase Authentication
        CreateRequest request = new CreateRequest()
                .setEmail(email.trim().toLowerCase())
                .setPassword(password)
                .setEmailVerified(false)
                .setDisabled(false);

        UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
        String uid = userRecord.getUid();
        logger.info("Usuario staff creado en Firebase Auth con UID: {}", uid);

        // 2. Asignar custom claim "rol" = "STAFF" para autorización en tokens
        Map<String, Object> claims = new HashMap<>();
        claims.put("rol", "STAFF");
        claims.put("role", "STAFF");
        FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
        logger.info("Custom claims STAFF asignados al UID: {}", uid);

        // 3. Guardar documento en Firestore → colección "usuarios", doc ID = uid
        try {
            Firestore firestore = FirestoreClient.getFirestore();
            Map<String, Object> userData = new HashMap<>();
            userData.put("email", email.trim().toLowerCase());
            userData.put("rol", "staff");

            firestore.collection("usuarios").document(uid).set(userData).get();
            logger.info("Documento Firestore creado en usuarios/{}", uid);
        } catch (Exception e) {
            // Si Firestore falla, el usuario ya existe en Auth; logueamos pero no
            // abortamos para no dejar un estado inconsistente silencioso.
            logger.error("Error al guardar documento en Firestore para UID {}: {}", uid, e.getMessage());
            throw new RuntimeException("Usuario creado en Auth pero fallo la escritura en Firestore: " + e.getMessage(), e);
        }

        return uid;
    }

    private void ensureFirebaseConfigured() {
        try {
            FirebaseApp.getInstance();
        } catch (IllegalStateException e) {
            throw new IllegalStateException("Firebase Admin SDK no esta configurado en el servidor.");
        }
    }
}
