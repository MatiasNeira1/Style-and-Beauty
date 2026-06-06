package com.style.beauty.ms_cliente.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.model.PersonaModel;
import com.style.beauty.ms_cliente.service.PerfilService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.lang.RuntimeException;
import java.util.UUID;
@RestController
@RequestMapping("/api/perfiles")
public class PerfilController {

    @Autowired
    private PerfilService perfilService;

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
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Falta el header Authorization.");
            }

            // Limpiamos el token
            String token = authHeader.replace("Bearer ", "");

            // Desencriptamos con Firebase
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);

            // Extraemos la Identidad y el Permiso
            String uidVerdadero = decodedToken.getUid();
            String rolVerdadero = (String) decodedToken.getClaims().get("rol");

            if (rolVerdadero == null) {
                return ResponseEntity.status(403).body("El usuario no tiene un rol asignado en Firebase.");
            }

            // Inyectamos la Verdad Absoluta en el DTO (Sobrescribiendo cualquier cosa)
            requestDTO.setIdAuth(uidVerdadero);
            requestDTO.setTipoPerfil(rolVerdadero);

            // Se lo enviamos al Jefe (El Servicio)
            PersonaModel nuevoPerfil = perfilService.registrarNuevoPerfil(requestDTO);
            
            return ResponseEntity.ok(nuevoPerfil);

        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(401).body("Token inválido o expirado.");
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
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Falta el header Authorization.");
            }

            String token = authHeader.replace("Bearer ", "");
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
            String uidVerdadero = decodedToken.getUid();

            PersonaModel miPerfil = perfilService.obtenerMiPerfil(uidVerdadero);
            return ResponseEntity.ok(miPerfil);

        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(401).body("Token inválido o expirado.");
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
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Falta el header Authorization.");
            }

            String token = authHeader.replace("Bearer ", "");
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
            String rol = (String) decodedToken.getClaims().get("rol");

            // SEGURIDAD: Solo STAFF puede ver la lista de todos los clientes
            if (!"STAFF".equalsIgnoreCase(rol) && !"ADMIN".equalsIgnoreCase(rol)) {
                return ResponseEntity.status(403).body("Acceso denegado. Solo el Staff puede ver esta lista.");
            }

            return ResponseEntity.ok(perfilService.listarTodosLosClientes());

        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(401).body("Token inválido.");
        }
    }

    // UPDATE: Actualizar mis datos

    @PutMapping("/actualizar")
    public ResponseEntity<?> actualizarPerfil(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody PerfilRequestDTO requestDTO) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Falta el header Authorization.");
            }

            String token = authHeader.replace("Bearer ", "");
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
            String uidVerdadero = decodedToken.getUid();

            PersonaModel perfilActualizado = perfilService.actualizarMiPerfil(uidVerdadero, requestDTO);
            return ResponseEntity.ok(perfilActualizado);

        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(401).body("Token inválido.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE: Eliminar mi cuenta
    @DeleteMapping("/eliminar")
    public ResponseEntity<?> eliminarPerfil(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Falta el header Authorization.");
            }

            String token = authHeader.replace("Bearer ", "");
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
            String uidVerdadero = decodedToken.getUid();

            perfilService.eliminarMiPerfil(uidVerdadero);
            return ResponseEntity.ok("Perfil eliminado correctamente de la base de datos.");

        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(401).body("Token inválido.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
