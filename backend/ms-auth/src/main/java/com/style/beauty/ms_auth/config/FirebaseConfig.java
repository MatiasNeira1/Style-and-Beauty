package com.style.beauty.ms_auth.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
public class FirebaseConfig {
    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @PostConstruct
    public void initFirebase() {
        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }

        try (InputStream serviceAccount = openCredentials()) {
            if (serviceAccount == null) {
                logger.warn("Firebase Admin SDK no se inicializo: configure FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, GOOGLE_APPLICATION_CREDENTIALS o agregue serviceAccountKey.json en resources.");
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            FirebaseApp.initializeApp(options);
            logger.info("Firebase Admin SDK inicializado correctamente.");
        } catch (Exception e) {
            logger.error("No se pudo inicializar Firebase Admin SDK: {}", e.getMessage());
        }
    }

    private InputStream openCredentials() throws Exception {
        String json = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");
        if (json != null && !json.isBlank()) {
            return new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8));
        }

        String path = System.getenv("FIREBASE_SERVICE_ACCOUNT_PATH");
        if (path == null || path.isBlank()) {
            path = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
        }

        if (path != null && !path.isBlank()) {
            return new FileInputStream(path);
        }

        return getClass().getClassLoader().getResourceAsStream("serviceAccountKey.json");
    }
}
