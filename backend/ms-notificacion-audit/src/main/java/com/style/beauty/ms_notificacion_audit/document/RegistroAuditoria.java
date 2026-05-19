package com.style.beauty.ms_notificacion_audit.document;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Document(collection = "registros_auditoria")
@Data
public class RegistroAuditoria {

    @Id
    private String id;

    private String accionRealizada;

    private String usuarioResponsableId;

    private String entidad;

    private LocalDateTime fechaAccion;

    private String valorAnterior;

    private String valorNuevo;

    private String detallesJson;
}
