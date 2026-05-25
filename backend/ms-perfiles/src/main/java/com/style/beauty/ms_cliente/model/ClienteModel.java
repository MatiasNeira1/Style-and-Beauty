package com.style.beauty.ms_cliente.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;


@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "clientes")
@PrimaryKeyJoinColumn(name = "id_cliente", referencedColumnName = "id_persona")
public class ClienteModel extends PersonaModel {

    @Column(name = "puntos_fidelidad", nullable = false)
    private Integer puntosFidelidad = 0;

    // Si se borra un cliente, su ficha medica se borra automáticamente (CascadeType.ALL)
    @OneToOne(mappedBy = "cliente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private FichaTecnicaModel fichaTecnica;
}
