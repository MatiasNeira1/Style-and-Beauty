package com.style.beauty.ms_cliente.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "staff")
@PrimaryKeyJoinColumn(name = "id_staff", referencedColumnName = "id_persona")

public class StaffModel extends PersonaModel {
    @ManyToOne(fetch = FetchType.EAGER)
    
    @JoinColumn(name = "id_especialidad", nullable = false)
    private EspecialidadModel especialidad;

    @Column(name = "holgura_cita_minutos", nullable = false)
    private Integer holguraCitaMinutos;

    @Column(name = "foto_url")
    private String fotoUrl;

    @Column(name = "cv_url")
    private String cvUrl;

    @Column(name = "descripcion_perfil", columnDefinition = "TEXT")
    private String descripcionPerfil;

    @OneToMany(mappedBy = "staff", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ContratoModel> contratos;
}
