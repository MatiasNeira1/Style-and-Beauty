package com.style.beauty.ms_cliente.service;

import com.style.beauty.ms_cliente.dto.ContactMessageRequest;
import com.style.beauty.ms_cliente.model.ClienteModel;
import com.style.beauty.ms_cliente.model.ContactMessageModel;
import com.style.beauty.ms_cliente.repository.ContactMessageRepository;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class ContactMessageService {
    private static final String SUBJECT_SOLICITUD_CONTACTO = "Solicitud de contacto";
    private static final Set<String> SUBJECTS_PERMITIDOS = Set.of(
            "Agradecimiento",
            "Queja",
            "Sugerencia",
            SUBJECT_SOLICITUD_CONTACTO
    );

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
        String subject = normalizarSubject(request.subject());

        ContactMessageModel contactMessage = new ContactMessageModel();
        contactMessage.setIdCliente(cliente.getIdPersona());
        contactMessage.setIdAuth(idAuth);
        contactMessage.setName(nombreCliente(cliente, request.name()));
        contactMessage.setEmail(valorCliente(cliente.getEmailContacto(), request.email()));
        contactMessage.setPhone(valorCliente(cliente.getTelefono(), request.phone()));
        contactMessage.setSubject(subject);
        contactMessage.setMessage(trim(request.message()));

        return contactMessageRepository.save(contactMessage);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizarSubject(String subject) {
        String value = isBlank(subject) ? SUBJECT_SOLICITUD_CONTACTO : subject.trim();
        if (!SUBJECTS_PERMITIDOS.contains(value)) {
            throw new IllegalArgumentException("Selecciona un motivo de contacto valido.");
        }
        return value;
    }

    private String nombreCliente(ClienteModel cliente, String fallback) {
        String nombre = trim(cliente.getNombre());
        String apellidos = trim(cliente.getApellidos());
        String nombreCompleto = String.join(
                " ",
                nombre == null ? "" : nombre,
                apellidos == null ? "" : apellidos
        ).trim();

        return nombreCompleto.isBlank() ? trim(fallback) : nombreCompleto;
    }

    private String valorCliente(String value, String fallback) {
        String valueFromProfile = trim(value);
        return isBlank(valueFromProfile) ? trim(fallback) : valueFromProfile;
    }
}
