package com.style.beauty.ms_catalogo.service;

import com.style.beauty.ms_catalogo.dto.AsignarStaffServicioRequest;
import com.style.beauty.ms_catalogo.dto.StaffServicioResponse;
import com.style.beauty.ms_catalogo.entity.ServicioStaff;
import com.style.beauty.ms_catalogo.repository.ServicioRepository;
import com.style.beauty.ms_catalogo.repository.ServicioStaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ServicioStaffService {

    private final ServicioStaffRepository servicioStaffRepository;
    private final ServicioRepository servicioRepository;

    public ServicioStaffService(
            ServicioStaffRepository servicioStaffRepository,
            ServicioRepository servicioRepository
    ) {
        this.servicioStaffRepository = servicioStaffRepository;
        this.servicioRepository = servicioRepository;
    }

    @Transactional
    public StaffServicioResponse asignar(AsignarStaffServicioRequest request) {
        validarRequest(request);
        validarServicioExiste(request.idServicio());

        ServicioStaff relacion = servicioStaffRepository
                .findByIdServicioAndIdStaff(request.idServicio(), request.idStaff())
                .map(existente -> {
                    if (!Boolean.TRUE.equals(existente.getActivo())) {
                        existente.setActivo(true);
                    }
                    return existente;
                })
                .orElseGet(() -> {
                    ServicioStaff nuevaRelacion = new ServicioStaff();
                    nuevaRelacion.setIdServicio(request.idServicio());
                    nuevaRelacion.setIdStaff(request.idStaff());
                    nuevaRelacion.setActivo(true);
                    return nuevaRelacion;
                });

        return toResponse(servicioStaffRepository.save(relacion));
    }

    @Transactional(readOnly = true)
    public List<StaffServicioResponse> listarPorServicio(UUID idServicio) {
        validarServicioExiste(idServicio);

        return servicioStaffRepository.findByIdServicioAndActivoTrue(idServicio)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean staffRealizaServicio(UUID idServicio, UUID idStaff) {
        validarServicioExiste(idServicio);

        if (idStaff == null) {
            return false;
        }

        return servicioStaffRepository.existsByIdServicioAndIdStaffAndActivoTrue(idServicio, idStaff);
    }

    @Transactional
    public Optional<StaffServicioResponse> desactivar(UUID idServicio, UUID idStaff) {
        validarServicioExiste(idServicio);

        return servicioStaffRepository.findByIdServicioAndIdStaff(idServicio, idStaff)
                .map(relacion -> {
                    relacion.setActivo(false);
                    return toResponse(servicioStaffRepository.save(relacion));
                });
    }

    private void validarRequest(AsignarStaffServicioRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud es obligatoria");
        }

        if (request.idServicio() == null) {
            throw new IllegalArgumentException("El idServicio es obligatorio");
        }

        if (request.idStaff() == null) {
            throw new IllegalArgumentException("El idStaff es obligatorio");
        }
    }

    private void validarServicioExiste(UUID idServicio) {
        if (idServicio == null || !servicioRepository.existsById(idServicio)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Servicio no encontrado");
        }
    }

    private StaffServicioResponse toResponse(ServicioStaff relacion) {
        return new StaffServicioResponse(
                relacion.getId(),
                relacion.getIdServicio(),
                relacion.getIdStaff(),
                relacion.getActivo()
        );
    }
}
