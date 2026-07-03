package com.style.beauty.ms_cliente.controller;

import com.google.firebase.auth.FirebaseToken;
import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.exception.DuplicateRutException;
import com.style.beauty.ms_cliente.exception.ProfileNotFoundException;
import com.style.beauty.ms_cliente.model.PersonaModel;
import com.style.beauty.ms_cliente.repository.EspecialidadRepository;
import com.style.beauty.ms_cliente.service.FirebaseClientRoleService;
import com.style.beauty.ms_cliente.service.FirebaseTokenVerifier;
import com.style.beauty.ms_cliente.service.PerfilService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/perfiles")
public class PerfilController {
    private static final Logger log = LoggerFactory.getLogger(PerfilController.class);

    @Autowired
    private PerfilService perfilService;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private FirebaseTokenVerifier firebaseTokenVerifier;

    @Autowired
    private FirebaseClientRoleService firebaseClientRoleService;

    @PostMapping("/validar-disponibilidad")
    public ResponseEntity<?> validarDisponibilidad(@RequestBody PerfilRequestDTO requestDTO) {
        try {
            perfilService.validarDisponibilidadParaCreacion(requestDTO);
            return ResponseEntity.ok("Usuario disponible.");
        } catch (DuplicateRutException e) {
            return mensaje(HttpStatus.CONFLICT, e.getMessage());
        } catch (IllegalArgumentException e) {
            return mensaje(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (RuntimeException e) {
            return mensaje(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return mensaje(HttpStatus.INTERNAL_SERVER_ERROR, "Error crítico: " + e.getMessage());
        }
    }

    @PostMapping("/crear")
    public ResponseEntity<?> crearNuevoPerfil(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody PerfilRequestDTO requestDTO) {

        try {
            FirebaseToken decodedToken = firebaseTokenVerifier.verify(authHeader);

            // Extraemos la Identidad y el Permiso
            String uidVerdadero = decodedToken.getUid();
            Object claimRol = decodedToken.getClaims().getOrDefault("rol", decodedToken.getClaims().get("role"));
            String rolVerdadero = claimRol == null ? null : String.valueOf(claimRol);

            if (rolVerdadero == null) {
                firebaseClientRoleService.ensureClientRoleForPublicProfile(uidVerdadero);
                rolVerdadero = "CLIENTE";
            }

            // Inyectamos la Verdad Absoluta en el DTO (Sobrescribiendo cualquier cosa)
            requestDTO.setIdAuth(uidVerdadero);
            requestDTO.setTipoPerfil(rolVerdadero);

            // Se lo enviamos al Jefe (El Servicio)
            PersonaModel nuevoPerfil = perfilService.registrarNuevoPerfil(requestDTO);
            
            return ResponseEntity.ok(nuevoPerfil);

        } catch (ResponseStatusException e) {
            return responseStatus(e);
        } catch (DuplicateRutException e) {
            return mensaje(HttpStatus.CONFLICT, e.getMessage());
        } catch (IllegalArgumentException e) {
            return mensaje(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (RuntimeException e) {
            return mensaje(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return mensaje(HttpStatus.INTERNAL_SERVER_ERROR, "Error crítico: " + e.getMessage());
        }
    }
    //obtener mi perfil
    @GetMapping("/me")
    public ResponseEntity<?> obtenerMiPerfil(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            FirebaseToken decodedToken = firebaseTokenVerifier.verify(authHeader);
            String uidVerdadero = decodedToken.getUid();

            PersonaModel miPerfil = perfilService.obtenerMiPerfil(uidVerdadero);
            return ResponseEntity.ok(miPerfil);

        } catch (ResponseStatusException e) {
            return responseStatus(e);
        } catch (ProfileNotFoundException e) {
            return profileNotFound(e);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping(value = "/me/foto", consumes = "multipart/form-data")
    public ResponseEntity<?> actualizarMiFoto(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("file") MultipartFile file) {
        try {
            FirebaseToken decodedToken = firebaseTokenVerifier.verify(authHeader);
            return ResponseEntity.ok(perfilService.actualizarFotoPropia(decodedToken.getUid(), file));
        } catch (ResponseStatusException e) {
            return responseStatus(e);
        } catch (ProfileNotFoundException e) {
            return profileNotFound(e);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Listar staff publico liviano.
    @GetMapping("/staff")
    public ResponseEntity<?> listarStaffPublico() {
        long start = System.nanoTime();
        try {
            return ResponseEntity.ok(perfilService.listarStaffLigero());
        } finally {
            logEndpointDuration("/api/perfiles/staff", start);
        }
    }

    @GetMapping("/staff/listado")
    public ResponseEntity<?> listarStaffPublicoLigero() {
        long start = System.nanoTime();
        try {
            return ResponseEntity.ok(perfilService.listarStaffLigero());
        } finally {
            logEndpointDuration("/api/perfiles/staff/listado", start);
        }
    }

    @GetMapping("/staff/resumen")
    public ResponseEntity<?> resumenStaffPublico() {
        long start = System.nanoTime();
        try {
            return ResponseEntity.ok(perfilService.obtenerResumenStaff());
        } finally {
            logEndpointDuration("/api/perfiles/staff/resumen", start);
        }
    }

    @GetMapping("/staff/{idStaff}/detalle")
    public ResponseEntity<?> obtenerDetalleStaffPublico(@PathVariable UUID idStaff) {
        long start = System.nanoTime();
        try {
            return ResponseEntity.ok(perfilService.obtenerDetalleStaff(idStaff));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } finally {
            logEndpointDuration("/api/perfiles/staff/{idStaff}/detalle", start);
        }
    }

    @GetMapping("/staff/{idStaff}")
    public ResponseEntity<?> obtenerStaffPublico(@PathVariable UUID idStaff) {
        try {
            return ResponseEntity.ok(perfilService.obtenerStaffPorIdConFallback(idStaff));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/staff/{idStaff}/portfolio")
    public ResponseEntity<?> listarPortfolioStaff(@PathVariable UUID idStaff) {
        try {
            return ResponseEntity.ok(perfilService.listarPortfolioStaff(idStaff));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/staff/{idStaff}/portfolio")
    public ResponseEntity<?> subirImagenPortfolioStaff(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID idStaff,
            @RequestParam("file") MultipartFile file) {
        try {
            validarStaffPropioOAdmin(authHeader, idStaff);
            return ResponseEntity.ok(perfilService.subirPortfolioStaff(idStaff, file));
        } catch (ResponseStatusException e) {
            return responseStatus(e);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/staff/{idStaff}/portfolio/{idFoto}")
    public ResponseEntity<?> eliminarImagenPortfolioStaff(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable UUID idStaff,
            @PathVariable UUID idFoto) {
        try {
            validarStaffPropioOAdmin(authHeader, idStaff);
            perfilService.eliminarPortfolioStaff(idStaff, idFoto);
            return ResponseEntity.ok(Map.of("message", "Imagen de portfolio eliminada correctamente."));
        } catch (ResponseStatusException e) {
            return responseStatus(e);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/especialidades")
    public ResponseEntity<?> listarEspecialidades() {
        return ResponseEntity.ok(especialidadRepository.findAll());
    }

    @GetMapping("/clientes")
    public ResponseEntity<?> listarClientes(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            FirebaseToken decodedToken = firebaseTokenVerifier.verify(authHeader);
            Object claimRol = decodedToken.getClaims().getOrDefault("rol", decodedToken.getClaims().get("role"));
            String rol = claimRol == null ? null : String.valueOf(claimRol);

            // SEGURIDAD: Solo STAFF puede ver la lista de todos los clientes
            if (!"STAFF".equalsIgnoreCase(rol) && !"ADMIN".equalsIgnoreCase(rol)) {
                return ResponseEntity.status(403).body("Acceso denegado. Solo el Staff puede ver esta lista.");
            }

            return ResponseEntity.ok(perfilService.listarTodosLosClientes());

        } catch (ResponseStatusException e) {
            return responseStatus(e);
        }
    }

    // UPDATE: Actualizar mis datos

    @PutMapping("/actualizar")
    public ResponseEntity<?> actualizarPerfil(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody PerfilRequestDTO requestDTO) {
        try {
            FirebaseToken decodedToken = firebaseTokenVerifier.verify(authHeader);
            String uidVerdadero = decodedToken.getUid();

            PersonaModel perfilActualizado = perfilService.actualizarMiPerfil(uidVerdadero, requestDTO);
            return ResponseEntity.ok(perfilActualizado);

        } catch (ResponseStatusException e) {
            return responseStatus(e);
        } catch (ProfileNotFoundException e) {
            return profileNotFound(e);
        } catch (DuplicateRutException e) {
            return mensaje(HttpStatus.CONFLICT, e.getMessage());
        } catch (IllegalArgumentException e) {
            return mensaje(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (RuntimeException e) {
            return mensaje(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // DELETE: Eliminar mi cuenta
    @DeleteMapping("/eliminar")
    public ResponseEntity<?> eliminarPerfil(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            FirebaseToken decodedToken = firebaseTokenVerifier.verify(authHeader);
            String uidVerdadero = decodedToken.getUid();

            perfilService.eliminarMiPerfil(uidVerdadero);
            return ResponseEntity.ok("Perfil eliminado correctamente de la base de datos.");

        } catch (ResponseStatusException e) {
            return responseStatus(e);
        } catch (ProfileNotFoundException e) {
            return profileNotFound(e);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private ResponseEntity<String> responseStatus(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
    }

    private ResponseEntity<Map<String, String>> mensaje(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    private void logEndpointDuration(String endpoint, long startNanos) {
        long elapsedMs = (System.nanoTime() - startNanos) / 1_000_000;
        log.info("{} respondio en {} ms", endpoint, elapsedMs);
    }

    private ResponseEntity<Map<String, String>> profileNotFound(ProfileNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "message", e.getMessage(),
                "code", "PROFILE_NOT_FOUND"
        ));
    }

    private void validarStaffPropioOAdmin(String authHeader, UUID idStaff) {
        FirebaseToken decodedToken = firebaseTokenVerifier.verify(authHeader);
        Object claimRol = decodedToken.getClaims().getOrDefault("rol", decodedToken.getClaims().get("role"));
        String rol = claimRol == null ? null : String.valueOf(claimRol);

        if ("ADMIN".equalsIgnoreCase(rol)) {
            return;
        }

        PersonaModel staff = perfilService.obtenerStaffPorId(idStaff);
        if (!decodedToken.getUid().equals(staff.getIdAuth())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo puedes modificar tu propio portfolio.");
        }
    }
}
