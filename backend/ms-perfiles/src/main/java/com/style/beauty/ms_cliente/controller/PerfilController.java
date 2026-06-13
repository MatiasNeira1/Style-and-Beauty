package com.style.beauty.ms_cliente.controller;

import com.google.firebase.auth.FirebaseToken;
import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.exception.ProfileNotFoundException;
import com.style.beauty.ms_cliente.model.PersonaModel;
import com.style.beauty.ms_cliente.service.FirebaseTokenVerifier;
import com.style.beauty.ms_cliente.service.PerfilService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/perfiles")
public class PerfilController {

    @Autowired
    private PerfilService perfilService;

    @Autowired
    private FirebaseTokenVerifier firebaseTokenVerifier;

    @PostMapping("/validar-disponibilidad")
    public ResponseEntity<?> validarDisponibilidad(@RequestBody PerfilRequestDTO requestDTO) {
        try {
            perfilService.validarDisponibilidadParaCreacion(requestDTO);
            return ResponseEntity.ok("Usuario disponible.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error crítico: " + e.getMessage());
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
            String rolVerdadero = (String) decodedToken.getClaims().get("rol");

            if (rolVerdadero == null) {
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
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error crítico: " + e.getMessage());
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

    // Listar Clientes (Endpoint Restringido)
    @GetMapping("/staff")
    public ResponseEntity<?> listarStaffPublico() {
        return ResponseEntity.ok(perfilService.listarTodoElStaff());
    }

    @GetMapping("/staff/{idStaff}")
    public ResponseEntity<?> obtenerStaffPublico(@PathVariable UUID idStaff) {
        try {
            return ResponseEntity.ok(perfilService.obtenerStaffPorId(idStaff));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/clientes")
    public ResponseEntity<?> listarClientes(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            FirebaseToken decodedToken = firebaseTokenVerifier.verify(authHeader);
            String rol = (String) decodedToken.getClaims().get("rol");

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
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
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

    private ResponseEntity<Map<String, String>> profileNotFound(ProfileNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "message", e.getMessage(),
                "code", "PROFILE_NOT_FOUND"
        ));
    }
}
