package com.style.beauty.ms_agenda.client;

import com.style.beauty.ms_agenda.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class PerfilClientTest {

    private static final UUID ID_STAFF = UUID.fromString("0299819d-926d-4098-a3a1-727961efb647");
    private static final UUID OTRO_ID = UUID.fromString("11111111-1111-4111-8111-111111111111");

    private PerfilClient perfilClient;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        perfilClient = new PerfilClient(builder, "http://ms-perfiles");
    }

    @Test
    void obtenerStaffUsaRutaPublicaDePerfilesYMapeaIdPersona() {
        server.expect(requestTo("http://ms-perfiles/api/perfiles/staff/" + ID_STAFF))
                .andRespond(withSuccess("""
                        {
                          "idPersona": "0299819d-926d-4098-a3a1-727961efb647",
                          "nombre": "Andrea",
                          "activo": true
                        }
                        """, MediaType.APPLICATION_JSON));

        PerfilResumen staff = perfilClient.obtenerStaff(ID_STAFF);

        assertThat(staff.idPersona()).isEqualTo(ID_STAFF);
        assertThat(staff.nombre()).isEqualTo("Andrea");
        server.verify();
    }

    @Test
    void obtenerStaffFallaSiIdPersonaNoCoincideConIdStaff() {
        server.expect(requestTo("http://ms-perfiles/api/perfiles/staff/" + ID_STAFF))
                .andRespond(withSuccess("""
                        {
                          "idPersona": "11111111-1111-4111-8111-111111111111",
                          "nombre": "Andrea",
                          "activo": true
                        }
                        """, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> perfilClient.obtenerStaff(ID_STAFF))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("idStaff no coincide");

        server.verify();
    }
}
