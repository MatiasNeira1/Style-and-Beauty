package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.dto.CalendarConfigRequest;
import com.style.beauty.ms_agenda.entity.StaffCalendarConfig;
import com.style.beauty.ms_agenda.exception.ResourceNotFoundException;
import com.style.beauty.ms_agenda.repository.StaffCalendarConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffCalendarConfigService {

    private final StaffCalendarConfigRepository repository;

    public Optional<StaffCalendarConfig> buscarPorStaff(UUID idStaff) {
        return repository.findByIdStaff(idStaff);
    }

    public Optional<StaffCalendarConfig> buscarActivoPorStaff(UUID idStaff) {
        return repository.findByIdStaffAndActivoTrue(idStaff);
    }

    @Transactional
    public StaffCalendarConfig guardar(UUID idStaff, CalendarConfigRequest request) {
        StaffCalendarConfig config = repository.findByIdStaff(idStaff)
                .orElseGet(() -> StaffCalendarConfig.builder()
                        .idStaff(idStaff)
                        .build());

        config.setCalendarId(request.calendarId());
        config.setActivo(request.activo() == null ? true : request.activo());

        return repository.save(config);
    }

    @Transactional
    public StaffCalendarConfig actualizar(UUID idStaff, CalendarConfigRequest request) {
        StaffCalendarConfig config = repository.findByIdStaff(idStaff)
                .orElseThrow(() -> new ResourceNotFoundException("Configuracion de calendario no encontrada para el staff"));

        config.setCalendarId(request.calendarId());
        config.setActivo(request.activo() == null ? true : request.activo());

        return repository.save(config);
    }
}
