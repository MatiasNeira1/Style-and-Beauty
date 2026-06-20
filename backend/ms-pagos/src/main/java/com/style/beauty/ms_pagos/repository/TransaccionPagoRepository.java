package com.style.beauty.ms_pagos.repository;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.style.beauty.ms_pagos.entity.TransaccionPago;
import com.style.beauty.ms_pagos.enums.EstadoTransaccion;
import java.util.Optional;

public interface TransaccionPagoRepository  extends JpaRepository<TransaccionPago, UUID>{
    Optional<TransaccionPago> findByTokenWebpay(String tokenWebpay);

    Optional<TransaccionPago> findByBuyOrder(String buyOrder);

    Optional<TransaccionPago> findByIdCita(UUID idCita);

    Optional<TransaccionPago> findFirstByIdCitaAndEstadoInOrderByCreatedAtDesc(
            UUID idCita,
            List<EstadoTransaccion> estados
    );

}
