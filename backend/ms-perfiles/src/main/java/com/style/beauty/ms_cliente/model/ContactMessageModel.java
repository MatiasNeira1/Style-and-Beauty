package com.style.beauty.ms_cliente.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "contact_messages")
public class ContactMessageModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_contact_message")
    private UUID idContactMessage;

    @Column(name = "id_cliente", nullable = false)
    private UUID idCliente;

    @Column(name = "id_auth", nullable = false)
    private String idAuth;

    private String name;
    private String email;
    private String phone;
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
