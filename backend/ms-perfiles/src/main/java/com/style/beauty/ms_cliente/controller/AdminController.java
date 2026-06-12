package com.style.beauty.ms_cliente.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.style.beauty.ms_cliente.service.PerfilService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.model.PersonaModel;
import com.style.beauty.ms_cliente.repository.EspecialidadRepository;

import java.util.UUID;



//ZONA DE ADMINISTRADOR
@RestController
@RequestMapping("/api")
public class AdminController {
    @Autowired
    private PerfilService perfilService;

    @Autowired
    private EspecialidadRepository especialidadRepository;

@GetMapping("/admin/staff")
    public ResponseEntity<?> adminListarStaff(@RequestHeader("Authorization") String authHeader) {
        try {
            if (!esAdmin(authHeader)) return ResponseEntity.status(403).body("Acceso denegado. Solo Administradores.");
            return ResponseEntity.ok(perfilService.listarTodoElStaff());
        } catch (Exception e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @GetMapping("/admin/especialidades")
    public ResponseEntity<?> adminListarEspecialidades(@RequestHeader("Authorization") String authHeader) {
        try {
            if (!esAdmin(authHeader)) return ResponseEntity.status(403).body("Acceso denegado. Solo Administradores.");
            return ResponseEntity.ok(especialidadRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    // 2. ADMIN: Crear OTRA persona (Ej. Contratar un nuevo Staff)
    @PostMapping("/admin/crear")
    public ResponseEntity<?> adminCrearPerfil(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody PerfilRequestDTO requestDTO) {
        try {
            if (!esAdmin(authHeader)) return ResponseEntity.status(403).body("Acceso denegado. Solo Administradores.");

            // OJO AQUÍ: Como es Admin, NO sobrescribimos el idAuth con el del Token del Admin.
            // Confiamos en que el Admin está mandando el idAuth y el tipoPerfil correcto del nuevo empleado en el JSON.
            if (requestDTO.getIdAuth() == null || requestDTO.getTipoPerfil() == null) {
                return ResponseEntity.badRequest().body("Para crear un usuario, el Admin debe enviar el idAuth y tipoPerfil.");
            }

            return ResponseEntity.ok(perfilService.registrarNuevoPerfil(requestDTO));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al crear perfil: " + e.getMessage());
        }
    }

    // 3. ADMIN: Editar a OTRA persona (Ej. Cambiar teléfono de un Staff)
    @PutMapping("/admin/actualizar/{idAuthTarget}")
    public ResponseEntity<?> adminActualizarPerfil(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String idAuthTarget,
            @RequestBody PerfilRequestDTO requestDTO) {
        try {
            if (!esAdmin(authHeader)) return ResponseEntity.status(403).body("Acceso denegado. Solo Administradores.");

            // Usamos el idAuth que viene en la URL, no el del Admin
            PersonaModel perfilActualizado = perfilService.actualizarMiPerfil(idAuthTarget, requestDTO);
            return ResponseEntity.ok(perfilActualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al actualizar: " + e.getMessage());
        }
    }

    @PostMapping({"/profesionales/{idStaff}/foto", "/admin/staff/{idStaff}/foto"})
    public ResponseEntity<?> adminActualizarFotoStaff(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID idStaff,
            @RequestParam("file") MultipartFile file) {
        try {
            if (!esAdmin(authHeader)) return ResponseEntity.status(403).body("Acceso denegado. Solo Administradores.");

            return ResponseEntity.ok(perfilService.actualizarFotoStaff(idStaff, file));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al actualizar foto: " + e.getMessage());
        }
    }

    @DeleteMapping({"/profesionales/{idStaff}/foto", "/admin/staff/{idStaff}/foto"})
    public ResponseEntity<?> adminEliminarFotoStaff(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID idStaff) {
        try {
            if (!esAdmin(authHeader)) return ResponseEntity.status(403).body("Acceso denegado. Solo Administradores.");

            return ResponseEntity.ok(perfilService.eliminarFotoStaff(idStaff));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al eliminar foto: " + e.getMessage());
        }
    }

    @PatchMapping({"/profesionales/{idStaff}/estado/{activo}", "/admin/staff/{idStaff}/estado/{activo}"})
    public ResponseEntity<?> adminActualizarEstadoStaff(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID idStaff,
            @PathVariable boolean activo) {
        try {
            if (!esAdmin(authHeader)) return ResponseEntity.status(403).body("Acceso denegado. Solo Administradores.");

            return ResponseEntity.ok(perfilService.actualizarEstadoStaff(idStaff, activo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al actualizar estado: " + e.getMessage());
        }
    }

    // 4. ADMIN: Eliminar a OTRA persona (Ej. Despedir a un Staff)
    @DeleteMapping("/admin/eliminar/{idAuthTarget}")
    public ResponseEntity<?> adminEliminarPerfil(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String idAuthTarget) {
        try {
            if (!esAdmin(authHeader)) return ResponseEntity.status(403).body("Acceso denegado. Solo Administradores.");

            perfilService.eliminarMiPerfil(idAuthTarget);
            return ResponseEntity.ok("Perfil eliminado correctamente de la base de datos.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al eliminar: " + e.getMessage());
        }
    }

    // --- Método Auxiliar Interno para no repetir código ---
    private boolean esAdmin(String authHeader) throws FirebaseAuthException {
        String token = authHeader.replace("Bearer ", "");
        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
        String rol = (String) decodedToken.getClaims().get("rol");
        return "ADMIN".equalsIgnoreCase(rol);
    }
}
