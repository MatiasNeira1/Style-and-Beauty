package com.style.beauty.ms_auth.service;

import com.google.firebase.FirebaseApp;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;

class AuthServiceTest {
    private final AuthService service = new AuthService();

    @Test
    void actualizarPasswordRechazaUidVacio() {
        try (MockedStatic<FirebaseApp> firebaseApp = mockStatic(FirebaseApp.class)) {
            firebaseApp.when(FirebaseApp::getInstance).thenReturn(mock(FirebaseApp.class));

            assertThatThrownBy(() -> service.actualizarPassword(" ", "password123"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("uid");
        }
    }

    @Test
    void actualizarPasswordRechazaPasswordVacia() {
        try (MockedStatic<FirebaseApp> firebaseApp = mockStatic(FirebaseApp.class)) {
            firebaseApp.when(FirebaseApp::getInstance).thenReturn(mock(FirebaseApp.class));

            assertThatThrownBy(() -> service.actualizarPassword("uid-123", " "))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("password");
        }
    }
}
