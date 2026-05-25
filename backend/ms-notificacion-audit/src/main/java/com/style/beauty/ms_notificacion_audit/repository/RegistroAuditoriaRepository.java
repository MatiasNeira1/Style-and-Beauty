package com.style.beauty.ms_notificacion_audit.repository;

import com.style.beauty.ms_notificacion_audit.document.RegistroAuditoria;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistroAuditoriaRepository extends MongoRepository<RegistroAuditoria, String> {

    List<RegistroAuditoria> findByUsuarioResponsableId(String usuarioId);

    List<RegistroAuditoria> findByEntidad(String entidad);

    List<RegistroAuditoria> findByAccionRealizada(String accion);
}
