package com.style.beauty.ms_notificacion_audit.service;

import com.style.beauty.ms_notificacion_audit.document.Alerta;
import com.style.beauty.ms_notificacion_audit.repository.AlertaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class NotificacionService {

    @Autowired
    private AlertaRepository repository;

    public List<Alerta> listarTodas() {
        return repository.findAll();
    }

    public List<Alerta> buscarPorUsuario(String usuarioId) {
        return repository.findByUsuarioDestinoId(usuarioId);
    }

    public List<Alerta> buscarPendientes() {
        return repository.findByEnviada(false);
    }

    public Alerta crear(Alerta alerta) {
        alerta.setFechaCreacion(LocalDateTime.now());
        alerta.setEnviada(false);
        return repository.save(alerta);
    }

    public Alerta marcarComoEnviada(String id) {
        Alerta alerta = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alerta no encontrada con id: " + id));
        alerta.setEnviada(true);
        return repository.save(alerta);
    }
}
