package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.dto.CrearJornadaStaffRequest;
import com.style.beauty.ms_agenda.entity.JornadaStaff;
import com.style.beauty.ms_agenda.exception.BusinessException;
import com.style.beauty.ms_agenda.repository.JornadaStaffRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JornadaStaffService {
    private final JornadaStaffRepository jornadaStaffRepository;

    public JornadaStaff crear(CrearJornadaStaffRequest request) {

        if (!request.horaInicio().isBefore(request.horaFin())) {
            throw new BusinessException("La hora de inicio debe ser menor que la hora de fin");
        }

        JornadaStaff jornada = JornadaStaff.builder()
                .idStaff(request.idStaff())
                .diaSemana(request.diaSemana())
                .horaInicio(request.horaInicio())
                .horaFin(request.horaFin())
                .activo(request.activo() != null ? request.activo() : true)
                .build();

        return jornadaStaffRepository.save(jornada);
    }

    public List<JornadaStaff> listarPorStaff(UUID idStaff) {
        return jornadaStaffRepository.findByIdStaff(idStaff);
    }

    public List<JornadaStaff> listarPorStaffYDia(UUID idStaff, Integer diaSemana) {
        return jornadaStaffRepository.findByIdStaffAndDiaSemanaAndActivoTrue(idStaff, diaSemana);
    }
}
