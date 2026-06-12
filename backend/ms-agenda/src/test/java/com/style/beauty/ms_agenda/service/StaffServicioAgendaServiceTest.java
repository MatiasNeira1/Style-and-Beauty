package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioClient;
import com.style.beauty.ms_agenda.client.ServicioStaffResumen;
import com.style.beauty.ms_agenda.dto.StaffServicioDetalleResponse;
import com.style.beauty.ms_agenda.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StaffServicioAgendaServiceTest {

    private static final UUID ID_SERVICIO = UUID.fromString("30000000-0000-0000-0000-000000000001");
    private static final UUID ID_STAFF = UUID.fromString("20000000-0000-0000-0000-000000000001");
    private static final UUID ID_STAFF_INACTIVO = UUID.fromString("20000000-0000-0000-0000-000000000002");
    private static final UUID ID_STAFF_FALTANTE = UUID.fromString("20000000-0000-0000-0000-000000000003");

    private final ServicioClient servicioClient = mock(ServicioClient.class);
    private final PerfilClient perfilClient = mock(PerfilClient.class);
    private final StaffServicioAgendaService service = new StaffServicioAgendaService(servicioClient, perfilClient);

    @Test
    void listaStaffConDetalleDesdeCatalogoYPerfiles() {
        when(servicioClient.obtenerStaffPorServicio(ID_SERVICIO))
                .thenReturn(List.of(new ServicioStaffResumen(ID_SERVICIO, ID_STAFF, true)));
        when(perfilClient.obtenerStaff(ID_STAFF))
                .thenReturn(new PerfilResumen(ID_STAFF, "auth-1", "1-9", "Camila", "Rojas", "camila@email.com", "https://storage.example/camila.webp", true));

        List<StaffServicioDetalleResponse> staff = service.listarStaffPorServicio(ID_SERVICIO);

        assertThat(staff).containsExactly(new StaffServicioDetalleResponse(
                ID_STAFF,
                "Camila",
                "Rojas",
                "camila@email.com",
                "https://storage.example/camila.webp",
                true
        ));
    }

    @Test
    void filtraRelacionesInactivasStaffInactivoYStaffInexistente() {
        when(servicioClient.obtenerStaffPorServicio(ID_SERVICIO))
                .thenReturn(List.of(
                        new ServicioStaffResumen(ID_SERVICIO, ID_STAFF, false),
                        new ServicioStaffResumen(ID_SERVICIO, ID_STAFF_INACTIVO, true),
                        new ServicioStaffResumen(ID_SERVICIO, ID_STAFF_FALTANTE, true)
                ));
        when(perfilClient.obtenerStaff(ID_STAFF_INACTIVO))
                .thenReturn(new PerfilResumen(ID_STAFF_INACTIVO, "auth-2", "2-7", "Fernanda", "Munoz", "fer@email.com", null, false));
        when(perfilClient.obtenerStaff(ID_STAFF_FALTANTE))
                .thenThrow(new BusinessException("Staff no encontrado en ms-perfiles"));

        List<StaffServicioDetalleResponse> staff = service.listarStaffPorServicio(ID_SERVICIO);

        assertThat(staff).isEmpty();
    }
}
