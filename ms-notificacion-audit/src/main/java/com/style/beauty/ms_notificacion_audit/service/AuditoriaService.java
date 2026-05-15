package com.style.beauty.ms_notificacion_audit.service;

import com.style.beauty.ms_notificacion_audit.document.RegistroAuditoria;
import com.style.beauty.ms_notificacion_audit.repository.RegistroAuditoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AuditoriaService {

    @Autowired
    private RegistroAuditoriaRepository repository;

    public List<RegistroAuditoria> listarTodos() {
        return repository.findAll();
    }

    public List<RegistroAuditoria> buscarPorUsuario(String usuarioId) {
        return repository.findByUsuarioResponsableId(usuarioId);
    }

    public List<RegistroAuditoria> buscarPorEntidad(String entidad) {
        return repository.findByEntidad(entidad);
    }

    public List<RegistroAuditoria> buscarPorAccion(String accion) {
        return repository.findByAccionRealizada(accion);
    }

    public RegistroAuditoria registrar(RegistroAuditoria registro) {
        registro.setFechaAccion(LocalDateTime.now());
        return repository.save(registro);
    }
}
