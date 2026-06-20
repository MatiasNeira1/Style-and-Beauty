package com.style.beauty.ms_catalogo.service;

import com.style.beauty.ms_catalogo.dto.AsignarStaffServicioRequest;
import com.style.beauty.ms_catalogo.dto.StaffServicioResponse;
import com.style.beauty.ms_catalogo.entity.ServicioStaff;
import com.style.beauty.ms_catalogo.repository.ServicioRepository;
import com.style.beauty.ms_catalogo.repository.ServicioStaffRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ServicioStaffServiceTest {
    private final ServicioStaffRepository servicioStaffRepository = mock(ServicioStaffRepository.class);
    private final ServicioRepository servicioRepository = mock(ServicioRepository.class);
    private final ServicioStaffService service = new ServicioStaffService(servicioStaffRepository, servicioRepository);

    @Test
    void asignarCreaRelacionSiNoExiste() {
        UUID idServicio = UUID.randomUUID();
        UUID idStaff = UUID.randomUUID();
        when(servicioRepository.existsById(idServicio)).thenReturn(true);
        when(servicioStaffRepository.findByIdServicioAndIdStaff(idServicio, idStaff)).thenReturn(Optional.empty());
        when(servicioStaffRepository.save(any(ServicioStaff.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StaffServicioResponse response = service.asignar(new AsignarStaffServicioRequest(idServicio, idStaff));

        assertThat(response.idServicio()).isEqualTo(idServicio);
        assertThat(response.idStaff()).isEqualTo(idStaff);
        assertThat(response.activo()).isTrue();
    }

    @Test
    void staffRealizaServicioRetornaFalseSiStaffEsNull() {
        UUID idServicio = UUID.randomUUID();
        when(servicioRepository.existsById(idServicio)).thenReturn(true);

        assertThat(service.staffRealizaServicio(idServicio, null)).isFalse();
    }

    @Test
    void listarPorServicioRechazaServicioInexistente() {
        UUID idServicio = UUID.randomUUID();
        when(servicioRepository.existsById(idServicio)).thenReturn(false);

        assertThatThrownBy(() -> service.listarPorServicio(idServicio))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Servicio no encontrado");
    }
}
