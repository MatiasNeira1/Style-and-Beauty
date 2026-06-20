package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.dto.CalendarConfigRequest;
import com.style.beauty.ms_agenda.entity.StaffCalendarConfig;
import com.style.beauty.ms_agenda.exception.ResourceNotFoundException;
import com.style.beauty.ms_agenda.repository.StaffCalendarConfigRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StaffCalendarConfigServiceTest {
    private final StaffCalendarConfigRepository repository = mock(StaffCalendarConfigRepository.class);
    private final StaffCalendarConfigService service = new StaffCalendarConfigService(repository);

    @Test
    void guardarCreaConfiguracionNuevaActivaPorDefecto() {
        UUID idStaff = UUID.randomUUID();
        when(repository.findByIdStaff(idStaff)).thenReturn(Optional.empty());
        when(repository.save(any(StaffCalendarConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StaffCalendarConfig config = service.guardar(idStaff, new CalendarConfigRequest("staff@test.cl", null));

        assertThat(config.getIdStaff()).isEqualTo(idStaff);
        assertThat(config.getCalendarId()).isEqualTo("staff@test.cl");
        assertThat(config.getActivo()).isTrue();
    }

    @Test
    void actualizarRechazaStaffSinConfiguracion() {
        UUID idStaff = UUID.randomUUID();
        when(repository.findByIdStaff(idStaff)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.actualizar(idStaff, new CalendarConfigRequest("staff@test.cl", true)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Configuracion");
    }
}
