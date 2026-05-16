package com.style.beauty.ms_notificacion_audit.document;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Document(collection = "alertas")
@Data
public class Alerta {

    @Id
    private String id;

    private String usuarioDestinoId;

    private String tipoCanal;

    private String asunto;

    private String cuerpoMensaje;

    private LocalDateTime fechaCreacion;

    private Boolean enviada = false;
}
