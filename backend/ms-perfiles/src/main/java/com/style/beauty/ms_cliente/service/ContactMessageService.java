package com.style.beauty.ms_cliente.service;

import com.style.beauty.ms_cliente.dto.ContactMessageRequest;
import com.style.beauty.ms_cliente.model.ClienteModel;
import com.style.beauty.ms_cliente.model.ContactMessageModel;
import com.style.beauty.ms_cliente.repository.ContactMessageRepository;
import org.springframework.stereotype.Service;

@Service
public class ContactMessageService {
    private final ContactMessageRepository contactMessageRepository;
    private final PerfilService perfilService;

    public ContactMessageService(ContactMessageRepository contactMessageRepository, PerfilService perfilService) {
        this.contactMessageRepository = contactMessageRepository;
        this.perfilService = perfilService;
    }

    public ContactMessageModel create(String idAuth, ContactMessageRequest request) {
        if (request == null || isBlank(request.message())) {
            throw new IllegalArgumentException("El mensaje es obligatorio.");
        }

        ClienteModel cliente = perfilService.obtenerClientePorAuthId(idAuth);

        ContactMessageModel contactMessage = new ContactMessageModel();
        contactMessage.setIdCliente(cliente.getIdPersona());
        contactMessage.setIdAuth(idAuth);
        contactMessage.setName(trim(request.name()));
        contactMessage.setEmail(trim(request.email()));
        contactMessage.setPhone(trim(request.phone()));
        contactMessage.setSubject(trim(request.subject()));
        contactMessage.setMessage(trim(request.message()));

        return contactMessageRepository.save(contactMessage);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
