package com.style.beauty.ms_cliente.service;

import com.style.beauty.ms_cliente.dto.ContactMessageRequest;
import com.style.beauty.ms_cliente.model.ClienteModel;
import com.style.beauty.ms_cliente.model.ContactMessageModel;
import com.style.beauty.ms_cliente.repository.ContactMessageRepository;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ContactMessageServiceTest {
    private final ContactMessageRepository repository = mock(ContactMessageRepository.class);
    private final PerfilService perfilService = mock(PerfilService.class);
    private final ContactMessageService service = new ContactMessageService(repository, perfilService);

    @Test
    void createCompletaDatosDesdePerfilCliente() {
        ClienteModel cliente = new ClienteModel();
        cliente.setIdPersona(UUID.randomUUID());
        cliente.setNombre("Maria");
        cliente.setApellidos("Lopez");
        cliente.setEmailContacto("maria@test.cl");
        cliente.setTelefono("999999999");
        when(perfilService.obtenerClientePorAuthId("auth-1")).thenReturn(cliente);
        when(repository.save(any(ContactMessageModel.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContactMessageModel message = service.create("auth-1", new ContactMessageRequest("Fallback", "fallback@test.cl", "111", "Sugerencia", "  Hola  "));

        assertThat(message.getName()).isEqualTo("Maria Lopez");
        assertThat(message.getEmail()).isEqualTo("maria@test.cl");
        assertThat(message.getSubject()).isEqualTo("Sugerencia");
        assertThat(message.getMessage()).isEqualTo("Hola");
    }

    @Test
    void createRechazaMensajeVacio() {
        assertThatThrownBy(() -> service.create("auth-1", new ContactMessageRequest(null, null, null, "Queja", " ")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mensaje");
    }
}
