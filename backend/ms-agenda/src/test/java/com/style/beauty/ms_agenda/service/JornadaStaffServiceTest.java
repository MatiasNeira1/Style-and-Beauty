package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.dto.CrearJornadaStaffRequest;
import com.style.beauty.ms_agenda.entity.JornadaStaff;
import com.style.beauty.ms_agenda.exception.BusinessException;
import com.style.beauty.ms_agenda.repository.JornadaStaffRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JornadaStaffServiceTest {
    private final JornadaStaffRepository repository = mock(JornadaStaffRepository.class);
    private final JornadaStaffService service = new JornadaStaffService(repository);

    @Test
    void crearGuardaJornadaActivaPorDefecto() {
        UUID idStaff = UUID.randomUUID();
        when(repository.save(any(JornadaStaff.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JornadaStaff jornada = service.crear(new CrearJornadaStaffRequest(idStaff, 1, LocalTime.of(9, 0), LocalTime.of(18, 0), null));

        assertThat(jornada.getIdStaff()).isEqualTo(idStaff);
        assertThat(jornada.getActivo()).isTrue();
    }

    @Test
    void crearRechazaHoraInicioMayorOIgualAHoraFin() {
        CrearJornadaStaffRequest request = new CrearJornadaStaffRequest(UUID.randomUUID(), 1, LocalTime.NOON, LocalTime.NOON, true);

        assertThatThrownBy(() -> service.crear(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("hora de inicio");
    }

    @Test
    void reemplazarPorStaffEliminaYGuardaOrdenado() {
        UUID idStaff = UUID.randomUUID();
        JornadaStaff lunes = JornadaStaff.builder().idStaff(idStaff).diaSemana(1).horaInicio(LocalTime.of(9, 0)).horaFin(LocalTime.of(18, 0)).activo(true).build();
        JornadaStaff martes = JornadaStaff.builder().idStaff(idStaff).diaSemana(2).horaInicio(LocalTime.of(9, 0)).horaFin(LocalTime.of(18, 0)).activo(true).build();
        when(repository.saveAll(any())).thenReturn(List.of(martes, lunes));

        List<JornadaStaff> jornadas = service.reemplazarPorStaff(idStaff, List.of(
                new CrearJornadaStaffRequest(idStaff, 2, LocalTime.of(9, 0), LocalTime.of(18, 0), true),
                new CrearJornadaStaffRequest(idStaff, 1, LocalTime.of(9, 0), LocalTime.of(18, 0), true)
        ));

        verify(repository).deleteByIdStaff(idStaff);
        assertThat(jornadas).extracting(JornadaStaff::getDiaSemana).containsExactly(1, 2);
    }
}
