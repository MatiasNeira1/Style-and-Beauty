package com.style.beauty.ms_cliente.repository;

import com.style.beauty.ms_cliente.model.ContactMessageModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ContactMessageRepository extends JpaRepository<ContactMessageModel, UUID> {
}
