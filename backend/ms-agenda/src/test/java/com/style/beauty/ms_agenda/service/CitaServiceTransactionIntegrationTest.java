package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioClient;
import com.style.beauty.ms_agenda.client.ServicioResumen;
import com.style.beauty.ms_agenda.dto.DisponibilidadRequest;
import com.style.beauty.ms_agenda.dto.DisponibilidadSlot;
import com.style.beauty.ms_agenda.entity.JornadaStaff;
import com.style.beauty.ms_agenda.repository.CitaRepository;
import com.style.beauty.ms_agenda.repository.JornadaStaffRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:ms_agenda_transaction_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.open-in-view=false",
        "spring.sql.init.mode=never"
})
class CitaServiceTransactionIntegrationTest {

    private static final UUID ID_STAFF = UUID.fromString("3ed5e6e2-7831-47a7-9ac4-563e828b57d3");
    private static final UUID ID_SERVICIO = UUID.fromString("e81a1fdd-5ac1-4c35-922b-517aa23a6a81");
    private static final LocalDate FECHA = LocalDate.of(2030, 1, 8);

    @Autowired
    private CitaService citaService;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private JornadaStaffRepository jornadaStaffRepository;

    @MockitoBean
    private PerfilClient perfilClient;

    @MockitoBean
    private ServicioClient servicioClient;

    @BeforeEach
    void setUp() {
        citaRepository.deleteAll();
        jornadaStaffRepository.deleteAll();

        when(perfilClient.obtenerStaff(ID_STAFF))
                .thenReturn(new PerfilResumen(
                        ID_STAFF,
                        null,
                        null,
                        "Renata",
                        "Silva",
                        "renata@example.test",
                        null,
                        true
                ));
        when(servicioClient.obtenerServicio(ID_SERVICIO))
                .thenReturn(new ServicioResumen(
                        ID_SERVICIO,
                        "Tratamiento capilar",
                        "Peluqueria",
                        20,
                        10
                ));
        when(servicioClient.staffRealizaServicio(ID_SERVICIO, ID_STAFF)).thenReturn(true);

        jornadaStaffRepository.save(JornadaStaff.builder()
                .idStaff(ID_STAFF)
                .diaSemana(FECHA.getDayOfWeek().getValue())
                .horaInicio(LocalTime.of(9, 0))
                .horaFin(LocalTime.of(12, 0))
                .activo(true)
                .build());
    }

    @Test
    void disponibilidadEjecutaExpiracionDeReservasConTransaccion() {
        List<DisponibilidadSlot> slots = citaService.calcularDisponibilidad(
                new DisponibilidadRequest(ID_STAFF, ID_SERVICIO, FECHA, null, null)
        );

        assertThat(slots).isNotEmpty();
    }
}
