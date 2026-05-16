package com.style.beauty.ms_cliente.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "fichas_tecnicas")

public class FichaTecnicaModel {
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false, unique = true)//crea la columna id_cliente en esta tabla.
    private ClienteModel cliente;
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_ficha_tecnica")
    private UUID idFichaTecnica;    
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String alergias;

    @Column(columnDefinition = "TEXT")
    private String medicamentos;

    @Column(name = "afecciones_piel", columnDefinition = "TEXT")
    private String afeccionesPiel;

    @Column(columnDefinition = "TEXT")
    private String comentarios;

}
