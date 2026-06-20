package com.style.beauty.ms_cliente.service;

import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.exception.ProfileNotFoundException;
import com.style.beauty.ms_cliente.model.ClienteModel;
import com.style.beauty.ms_cliente.model.PersonaModel;
import com.style.beauty.ms_cliente.repository.ClienteRepository;
import com.style.beauty.ms_cliente.repository.EspecialidadRepository;
import com.style.beauty.ms_cliente.repository.PersonaRepository;
import com.style.beauty.ms_cliente.repository.StaffPortfolioImageRepository;
import com.style.beauty.ms_cliente.repository.StaffRepository;
import com.style.beauty.ms_cliente.strategy.PerfilStrategy;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PerfilServiceTest {
    private final PersonaRepository personaRepository = mock(PersonaRepository.class);
    private final ClienteRepository clienteRepository = mock(ClienteRepository.class);
    private final StaffRepository staffRepository = mock(StaffRepository.class);
    private final StaffPortfolioImageRepository staffPortfolioImageRepository = mock(StaffPortfolioImageRepository.class);
    private final EspecialidadRepository especialidadRepository = mock(EspecialidadRepository.class);
    private final AzureBlobStorageService azureBlobStorageService = mock(AzureBlobStorageService.class);
    private final PerfilStrategy clienteStrategy = mock(PerfilStrategy.class);
    private final PerfilService service = new PerfilService(
            personaRepository,
            clienteRepository,
            staffRepository,
            staffPortfolioImageRepository,
            especialidadRepository,
            azureBlobStorageService,
            List.of(clienteStrategy)
    );

    @Test
    void registrarNuevoPerfilDelegaEnEstrategiaSegunTipo() {
        PerfilRequestDTO dto = clienteDto();
        ClienteModel cliente = new ClienteModel();
        when(clienteStrategy.getTipoPerfil()).thenReturn("CLIENTE");
        when(clienteStrategy.crearPerfil(dto)).thenReturn(cliente);

        PersonaModel creado = service.registrarNuevoPerfil(dto);

        assertThat(creado).isSameAs(cliente);
        assertThat(dto.getTipoPerfil()).isEqualTo("CLIENTE");
        assertThat(dto.getEmailContacto()).isEqualTo("cliente@test.cl");
    }

    @Test
    void obtenerMiPerfilLanzaSiNoExiste() {
        when(personaRepository.findByIdAuth("auth-404")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.obtenerMiPerfil("auth-404"))
                .isInstanceOf(ProfileNotFoundException.class)
                .hasMessageContaining("Perfil no encontrado");
    }

    @Test
    void validarDisponibilidadParaCreacionRechazaClienteMenorDeEdad() {
        PerfilRequestDTO dto = clienteDto();
        dto.setFechaNacimiento(LocalDate.now().minusYears(10));

        assertThatThrownBy(() -> service.validarDisponibilidadParaCreacion(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("15");
    }

    private PerfilRequestDTO clienteDto() {
        PerfilRequestDTO dto = new PerfilRequestDTO();
        dto.setIdAuth("auth-1");
        dto.setTipoPerfil("cliente");
        dto.setRut("11.111.111-1");
        dto.setNombre("Cliente");
        dto.setEmailContacto("CLIENTE@TEST.CL");
        dto.setFechaNacimiento(LocalDate.now().minusYears(20));
        dto.setGenero("femenino");
        return dto;
    }
}
