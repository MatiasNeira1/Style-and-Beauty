package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioClient;
import com.style.beauty.ms_agenda.client.ServicioStaffResumen;
import com.style.beauty.ms_agenda.dto.StaffServicioDetalleResponse;
import com.style.beauty.ms_agenda.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffServicioAgendaService {

    private final ServicioClient servicioClient;
    private final PerfilClient perfilClient;

    public List<StaffServicioDetalleResponse> listarStaffPorServicio(UUID idServicio) {
        return servicioClient.obtenerStaffPorServicio(idServicio)
                .stream()
                .filter(relacion -> Boolean.TRUE.equals(relacion.activo()))
                .map(this::obtenerDetalleStaff)
                .filter(detalle -> detalle != null && Boolean.TRUE.equals(detalle.activo()))
                .toList();
    }

    private StaffServicioDetalleResponse obtenerDetalleStaff(ServicioStaffResumen relacion) {
        if (relacion.idStaff() == null) {
            return null;
        }

        try {
            PerfilResumen staff = perfilClient.obtenerStaff(relacion.idStaff());
            Boolean activo = staff.activo() == null ? true : staff.activo();

            return new StaffServicioDetalleResponse(
                    staff.idPersona() == null ? relacion.idStaff() : staff.idPersona(),
                    staff.nombre(),
                    staff.apellidos(),
                    staff.emailContacto(),
                    activo
            );
        } catch (BusinessException e) {
            return null;
        }
    }
}
