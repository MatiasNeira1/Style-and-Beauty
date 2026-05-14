package com.style.beauty.ms_pagos.repository;

import com.style.beauty.ms_pagos.entity.Transaccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TransaccionRepository extends JpaRepository<Transaccion, UUID> {

    Optional<Transaccion> findByCodigoWebpay(String codigoWebpay);

    Optional<Transaccion> findByTokenWebpay(String tokenWebpay);
}