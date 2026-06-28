package com.style.beauty.ms_cliente.repository;

import com.style.beauty.ms_cliente.dto.StaffDetalleBaseDTO;
import com.style.beauty.ms_cliente.dto.StaffListadoDTO;
import com.style.beauty.ms_cliente.model.StaffModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StaffRepository extends JpaRepository<StaffModel, UUID> {

    @Query("""
            select new com.style.beauty.ms_cliente.dto.StaffListadoDTO(
                s.idPersona,
                s.idPersona,
                s.nombre,
                s.apellidos,
                e.nombre,
                s.fotoUrl,
                s.experienciaAnios,
                true
            )
            from StaffModel s
            left join s.especialidad e
            order by s.nombre asc, s.apellidos asc
            """)
    List<StaffListadoDTO> listarStaffLigero();

    @Query("""
            select new com.style.beauty.ms_cliente.dto.StaffDetalleBaseDTO(
                s.idPersona,
                s.idAuth,
                s.rut,
                s.nombre,
                s.apellidos,
                s.fechaNacimiento,
                s.genero,
                s.telefono,
                s.emailContacto,
                e.idEspecialidad,
                e.nombre,
                s.fotoUrl,
                s.cvUrl,
                s.descripcionPerfil,
                s.experienciaAnios,
                true
            )
            from StaffModel s
            left join s.especialidad e
            where s.idPersona = :idStaff
            """)
    Optional<StaffDetalleBaseDTO> buscarDetalleBase(@Param("idStaff") UUID idStaff);

    @Query("select count(s) from StaffModel s where s.fotoUrl is not null and trim(s.fotoUrl) <> ''")
    long contarConFoto();

    @Query("select count(s) from StaffModel s where s.experienciaAnios is not null and s.experienciaAnios > 0")
    long contarConExperiencia();
}
