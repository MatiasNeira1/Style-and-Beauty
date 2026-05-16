package com.style.beauty.ms_notificacion_audit.repository;

import com.style.beauty.ms_notificacion_audit.document.Alerta;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AlertaRepository extends MongoRepository<Alerta, String> {

    List<Alerta> findByUsuarioDestinoId(String usuarioId);

    List<Alerta> findByEnviada(Boolean enviada);
}
