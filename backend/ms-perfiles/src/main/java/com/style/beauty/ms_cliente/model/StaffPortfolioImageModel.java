package com.style.beauty.ms_cliente.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "staff_portfolio_images")
public class StaffPortfolioImageModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_foto")
    private UUID idFoto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_staff", nullable = false)
    @JsonIgnore
    private StaffModel staff;

    @Column(name = "url_foto", nullable = false, length = 512)
    private String urlFoto;

    @Column(name = "nombre_archivo")
    private String nombreArchivo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    @Transient
    public UUID getIdStaff() {
        return staff == null ? null : staff.getIdPersona();
    }
}
