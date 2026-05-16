package com.style.beauty.ms_cliente.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "contratos")
public class ContratoModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_contrato")
    private Long idContrato;

    // Relación de Muchos a 1 con el Staff
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_staff", nullable = false)
    private StaffModel staff;

    @Column(nullable = false)
    private String tipo; // Ej: "Plazo Fijo", "Indefinido", "Honorarios"

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_termino")
    private LocalDate fechaTermino;
}
