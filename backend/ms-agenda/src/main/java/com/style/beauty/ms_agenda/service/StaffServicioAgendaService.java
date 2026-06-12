package com.style.beauty.ms_agenda.service;

import com.style.beauty.ms_agenda.client.PerfilClient;
import com.style.beauty.ms_agenda.client.PerfilResumen;
import com.style.beauty.ms_agenda.client.ServicioClient;
import com.style.beauty.ms_agenda.client.ServicioStaffResumen;
import com.style.beauty.ms_agenda.dto.StaffServicioDetalleResponse;
import com.style.beauty.ms_agenda.exception.BusinessException;
import com.style.beauty.ms_agenda.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
public class StaffServicioAgendaService {

    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final ServicioClient servicioClient;
    private final PerfilClient perfilClient;
    private final ConcurrentMap<UUID, CachedStaffList> staffPorServicioCache = new ConcurrentHashMap<>();
    private final ConcurrentMap<UUID, CachedStaffDetail> staffDetalleCache = new ConcurrentHashMap<>();

    public List<StaffServicioDetalleResponse> listarStaffPorServicio(UUID idServicio) {
        CachedStaffList cached = staffPorServicioCache.get(idServicio);
        if (cached != null && !cached.isExpired()) {
            return cached.staff();
        }

        List<ServicioStaffResumen> relaciones;
        try {
            relaciones = servicioClient.obtenerStaffPorServicio(idServicio);
        } catch (BusinessException e) {
            relaciones = List.of();
        }

        List<StaffServicioDetalleResponse> staff = relaciones.stream()
                .filter(relacion -> Boolean.TRUE.equals(relacion.activo()))
                .map(this::obtenerDetalleStaff)
                .filter(detalle -> detalle != null && Boolean.TRUE.equals(detalle.activo()))
                .toList();

        staffPorServicioCache.put(idServicio, new CachedStaffList(staff, Instant.now()));
        return staff;
    }

    private StaffServicioDetalleResponse obtenerDetalleStaff(ServicioStaffResumen relacion) {
        if (relacion.idStaff() == null) {
            return null;
        }

        CachedStaffDetail cached = staffDetalleCache.get(relacion.idStaff());
        if (cached != null && !cached.isExpired()) {
            return cached.staff();
        }

        try {
            PerfilResumen staff = perfilClient.obtenerStaff(relacion.idStaff());
            Boolean activo = staff.activo() == null ? true : staff.activo();

            StaffServicioDetalleResponse detalle = new StaffServicioDetalleResponse(
                    staff.idPersona() == null ? relacion.idStaff() : staff.idPersona(),
                    staff.nombre(),
                    staff.apellidos(),
                    staff.emailContacto(),
                    staff.fotoUrl(),
                    activo
            );
            staffDetalleCache.put(relacion.idStaff(), new CachedStaffDetail(detalle, Instant.now()));
            return detalle;
        } catch (BusinessException | ResourceNotFoundException e) {
            return null;
        }
    }

    private record CachedStaffList(List<StaffServicioDetalleResponse> staff, Instant createdAt) {
        private boolean isExpired() {
            return createdAt.plus(CACHE_TTL).isBefore(Instant.now());
        }
    }

    private record CachedStaffDetail(StaffServicioDetalleResponse staff, Instant createdAt) {
        private boolean isExpired() {
            return createdAt.plus(CACHE_TTL).isBefore(Instant.now());
        }
    }
}
