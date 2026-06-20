package com.style.beauty.ms_auth.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

class RolServiceTest {
    private final RolService service = new RolService();

    @Test
    void assignClientRoleFromPublicFlowRechazaRolProtegidoExistente() throws Exception {
        FirebaseAuth auth = mock(FirebaseAuth.class);
        UserRecord user = mock(UserRecord.class);
        when(user.getCustomClaims()).thenReturn(Map.of("rol", "ADMIN"));
        when(auth.getUser("uid-admin")).thenReturn(user);

        try (
                MockedStatic<FirebaseApp> firebaseApp = mockStatic(FirebaseApp.class);
                MockedStatic<FirebaseAuth> firebaseAuth = mockStatic(FirebaseAuth.class)
        ) {
            firebaseApp.when(FirebaseApp::getInstance).thenReturn(mock(FirebaseApp.class));
            firebaseAuth.when(FirebaseAuth::getInstance).thenReturn(auth);

            assertThatThrownBy(() -> service.assignClientRoleFromPublicFlow("uid-admin"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("rol protegido");
        }
    }
}
