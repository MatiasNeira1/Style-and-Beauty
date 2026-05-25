package com.style.beauty.ms_inventario.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID idStock;

    @Column(nullable = false)
    private UUID idProducto;

    @Column(nullable = false)
    private Integer cantidadActual;

    @Column(nullable = false)
    private String unidadMedida;

    private Integer stockMinimo;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();

        if (cantidadActual == null)
            cantidadActual = 0;
        if (stockMinimo == null)
            stockMinimo = 0;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}