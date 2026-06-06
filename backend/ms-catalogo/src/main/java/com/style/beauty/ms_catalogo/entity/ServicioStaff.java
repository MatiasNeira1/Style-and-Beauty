package com.style.beauty.ms_catalogo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "servicio_staff",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_servicio_staff_servicio_staff",
                columnNames = {"id_servicio", "id_staff"}
        )
)
@Data
public class ServicioStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "id_servicio", nullable = false)
    private UUID idServicio;

    @Column(name = "id_staff", nullable = false)
    private UUID idStaff;

    @Column(nullable = false)
    private Boolean activo = true;

    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = OffsetDateTime.now();
        if (activo == null) {
            activo = true;
        }
    }
}
