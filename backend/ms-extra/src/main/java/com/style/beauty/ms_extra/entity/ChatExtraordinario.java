package com.style.beauty.ms_extra.entity;

import com.style.beauty.ms_extra.enums.RemitenteChat;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_extraordinario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatExtraordinario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idMensaje;

    @Column(nullable = false)
    private UUID idCitaExtraordinaria;

    @Column(nullable = false)
    private UUID idUsuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RemitenteChat remitente;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    private OffsetDateTime fechaEnvio;

    @PrePersist
    public void prePersist() {
        fechaEnvio = OffsetDateTime.now();
    }
}