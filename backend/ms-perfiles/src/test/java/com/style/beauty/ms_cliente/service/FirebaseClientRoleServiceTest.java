package com.style.beauty.ms_cliente.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

class FirebaseClientRoleServiceTest {
    private final FirebaseClientRoleService service = new FirebaseClientRoleService();

    @Test
    void ensureClientRoleForPublicProfileRechazaUidVacio() {
        assertThatThrownBy(() -> service.ensureClientRoleForPublicProfile(" "))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("identificar");
    }

    @Test
    void ensureClientRoleForPublicProfileRechazaRolProtegido() throws Exception {
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

            assertThatThrownBy(() -> service.ensureClientRoleForPublicProfile("uid-admin"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("rol protegido");
        }
    }
}
