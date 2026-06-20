package com.style.beauty.ms_catalogo.controller;

import com.style.beauty.ms_catalogo.dto.AsignarStaffServicioRequest;
import com.style.beauty.ms_catalogo.dto.StaffServicioResponse;
import com.style.beauty.ms_catalogo.service.ServicioStaffService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class ServicioStaffController {

    private final ServicioStaffService servicioStaffService;

    public ServicioStaffController(ServicioStaffService servicioStaffService) {
        this.servicioStaffService = servicioStaffService;
    }

    @PostMapping("/api/servicio-staff")
    public ResponseEntity<StaffServicioResponse> asignar(@RequestBody AsignarStaffServicioRequest request) {
        return ResponseEntity.ok(servicioStaffService.asignar(request));
    }

    @GetMapping({
            "/api/servicio/{idServicio}/staff",
            "/api/servicios/{idServicio}/staff",
            "/api/catalogo/servicios/{idServicio}/staff"
    })
    public List<StaffServicioResponse> listarPorServicio(@PathVariable UUID idServicio) {
        return servicioStaffService.listarPorServicio(idServicio);
    }

    @GetMapping({
            "/api/servicio/{idServicio}/staff/{idStaff}/validar",
            "/api/servicios/{idServicio}/staff/{idStaff}/validar",
            "/api/catalogo/servicios/{idServicio}/staff/{idStaff}/validar"
    })
    public boolean validarStaffServicio(
            @PathVariable UUID idServicio,
            @PathVariable UUID idStaff
    ) {
        return servicioStaffService.staffRealizaServicio(idServicio, idStaff);
    }

    @DeleteMapping("/api/servicio/{idServicio}/staff/{idStaff}")
    public ResponseEntity<Void> desactivar(
            @PathVariable UUID idServicio,
            @PathVariable UUID idStaff
    ) {
        return servicioStaffService.desactivar(idServicio, idStaff)
                .map(relacion -> ResponseEntity.noContent().<Void>build())
                .orElse(ResponseEntity.notFound().build());
    }
}
