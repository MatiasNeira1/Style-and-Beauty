package com.style.beauty.ms_cliente.service;

import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.dto.StaffDetalleBaseDTO;
import com.style.beauty.ms_cliente.dto.StaffDetalleDTO;
import com.style.beauty.ms_cliente.dto.StaffListadoDTO;
import com.style.beauty.ms_cliente.dto.StaffPortfolioImageDTO;
import com.style.beauty.ms_cliente.exception.ProfileNotFoundException;
import com.style.beauty.ms_cliente.model.ClienteModel;
import com.style.beauty.ms_cliente.model.PersonaModel;
import com.style.beauty.ms_cliente.model.StaffModel;
import com.style.beauty.ms_cliente.repository.ClienteRepository;
import com.style.beauty.ms_cliente.repository.EspecialidadRepository;
import com.style.beauty.ms_cliente.repository.PersonaRepository;
import com.style.beauty.ms_cliente.repository.StaffPortfolioImageRepository;
import com.style.beauty.ms_cliente.repository.StaffRepository;
import com.style.beauty.ms_cliente.strategy.PerfilStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class PerfilServiceTest {
    private final PersonaRepository personaRepository = mock(PersonaRepository.class);
    private final ClienteRepository clienteRepository = mock(ClienteRepository.class);
    private final StaffRepository staffRepository = mock(StaffRepository.class);
    private final StaffPortfolioImageRepository staffPortfolioImageRepository = mock(StaffPortfolioImageRepository.class);
    private final EspecialidadRepository especialidadRepository = mock(EspecialidadRepository.class);
    private final AzureBlobStorageService azureBlobStorageService = mock(AzureBlobStorageService.class);
    private final PerfilStrategy clienteStrategy = mock(PerfilStrategy.class);
    private PerfilService service;

    @BeforeEach
    void setUp() {
        when(clienteStrategy.getTipoPerfil()).thenReturn("CLIENTE");
        service = new PerfilService(
                personaRepository,
                clienteRepository,
                staffRepository,
                staffPortfolioImageRepository,
                especialidadRepository,
                azureBlobStorageService,
                List.of(clienteStrategy)
        );
    }

    @Test
    void registrarNuevoPerfilDelegaEnEstrategiaSegunTipo() {
        PerfilRequestDTO dto = clienteDto();
        ClienteModel cliente = new ClienteModel();
        when(clienteStrategy.getTipoPerfil()).thenReturn("CLIENTE");
        when(clienteStrategy.crearPerfil(dto)).thenReturn(cliente);

        PersonaModel creado = service.registrarNuevoPerfil(dto);

        assertThat(creado).isSameAs(cliente);
        assertThat(dto.getTipoPerfil()).isEqualTo("CLIENTE");
        assertThat(dto.getRut()).isEqualTo("12345678-5");
        assertThat(dto.getTelefono()).isEqualTo("56912345678");
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

    @Test
    void validarDisponibilidadParaCreacionRechazaRutInvalido() {
        PerfilRequestDTO dto = clienteDto();
        dto.setRut("12345678-9");

        assertThatThrownBy(() -> service.validarDisponibilidadParaCreacion(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("RUT");
    }

    @Test
    void validarDisponibilidadParaCreacionRechazaTelefonoNoChileno() {
        PerfilRequestDTO dto = clienteDto();
        dto.setTelefono("telefono-no-valido");

        assertThatThrownBy(() -> service.validarDisponibilidadParaCreacion(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("telefono chileno");
    }

    @Test
    void validarDisponibilidadParaCreacionRechazaRutDuplicadoNormalizado() {
        PerfilRequestDTO dto = clienteDto();
        PersonaModel existente = new ClienteModel();
        existente.setIdPersona(UUID.randomUUID());
        existente.setRut("12.345.678-5");
        when(personaRepository.findAllByRutCompact("123456785")).thenReturn(List.of(existente));

        assertThatThrownBy(() -> service.validarDisponibilidadParaCreacion(dto))
                .hasMessageContaining("RUT ingresado ya se encuentra registrado");
    }

    @Test
    void actualizarPerfilComoAdminPermiteMantenerMismoRutNormalizado() {
        UUID idPersona = UUID.randomUUID();
        ClienteModel cliente = new ClienteModel();
        cliente.setIdPersona(idPersona);
        cliente.setRut("12.345.678-5");
        PerfilRequestDTO dto = new PerfilRequestDTO();
        dto.setRut("12345678-5");

        when(personaRepository.findByIdAuth("auth-1")).thenReturn(Optional.of(cliente));
        when(personaRepository.findAllByRutCompact("123456785")).thenReturn(List.of(cliente));
        when(personaRepository.save(cliente)).thenReturn(cliente);

        PersonaModel actualizado = service.actualizarPerfilComoAdmin("auth-1", dto);

        assertThat(actualizado.getRut()).isEqualTo("12345678-5");
        verify(personaRepository).save(cliente);
    }

    @Test
    void actualizarPerfilNormalizaTelefonoChileno() {
        ClienteModel cliente = new ClienteModel();
        PerfilRequestDTO dto = new PerfilRequestDTO();
        dto.setTelefono("+56 9 8765 4321");

        when(personaRepository.findByIdAuth("auth-1")).thenReturn(Optional.of(cliente));
        when(personaRepository.save(cliente)).thenReturn(cliente);

        PersonaModel actualizado = service.actualizarMiPerfil("auth-1", dto);

        assertThat(actualizado.getTelefono()).isEqualTo("56987654321");
        verify(personaRepository).save(cliente);
    }

    @Test
    void actualizarMiPerfilStaffIgnoraCamposGestionadosPorAdmin() {
        StaffModel staff = new StaffModel();
        staff.setNombre("Valentina");
        staff.setApellidos("Rojas");
        staff.setExperienciaAnios(7);

        PerfilRequestDTO dto = new PerfilRequestDTO();
        dto.setNombre("Nombre editado");
        dto.setApellidos("Apellido editado");
        dto.setExperienciaAnios(20);
        dto.setTelefono("+56 9 8765 4321");
        dto.setDescripcionPerfil("Perfil actualizado por staff");

        when(personaRepository.findByIdAuth("staff-auth")).thenReturn(Optional.of(staff));
        when(personaRepository.save(staff)).thenReturn(staff);

        PersonaModel actualizado = service.actualizarMiPerfil("staff-auth", dto);

        assertThat(actualizado).isSameAs(staff);
        assertThat(staff.getNombre()).isEqualTo("Valentina");
        assertThat(staff.getApellidos()).isEqualTo("Rojas");
        assertThat(staff.getExperienciaAnios()).isEqualTo(7);
        assertThat(staff.getTelefono()).isEqualTo("56987654321");
        assertThat(staff.getDescripcionPerfil()).isEqualTo("Perfil actualizado por staff");
        verify(personaRepository).save(staff);
    }

    @Test
    void listarStaffLigeroUsaProjectionSinConsultarPortfolio() {
        UUID idStaff = UUID.randomUUID();
        StaffListadoDTO row = new StaffListadoDTO(
                idStaff,
                idStaff,
                "Camila",
                "Torres",
                "Nails",
                "https://example.test/foto.webp",
                6,
                true
        );
        when(staffRepository.listarStaffLigero()).thenReturn(List.of(row));

        List<StaffListadoDTO> result = service.listarStaffLigero();

        assertThat(result).containsExactly(row);
        verify(staffRepository).listarStaffLigero();
        verifyNoInteractions(staffPortfolioImageRepository);
    }

    @Test
    void obtenerDetalleStaffCargaPortfolioBajoDemanda() {
        UUID idStaff = UUID.randomUUID();
        StaffDetalleBaseDTO base = new StaffDetalleBaseDTO(
                idStaff,
                "staff-auth",
                "12345678-5",
                "Camila",
                "Torres",
                LocalDate.of(1992, 4, 12),
                "femenino",
                "56912345678",
                "camila@test.cl",
                1L,
                "Nails",
                "https://example.test/foto.webp",
                "https://example.test/cv.pdf",
                "Especialista en manicure",
                6,
                true
        );
        StaffPortfolioImageDTO image = new StaffPortfolioImageDTO(
                UUID.randomUUID(),
                "https://example.test/portfolio.webp",
                "portfolio.webp",
                OffsetDateTime.parse("2026-06-27T12:00:00Z")
        );
        when(staffRepository.buscarDetalleBase(idStaff)).thenReturn(Optional.of(base));
        when(staffPortfolioImageRepository.listarPortfolioLigero(idStaff)).thenReturn(List.of(image));

        StaffDetalleDTO result = service.obtenerDetalleStaff(idStaff);

        assertThat(result.idStaff()).isEqualTo(idStaff);
        assertThat(result.idAuth()).isEqualTo("staff-auth");
        assertThat(result.especialidad()).isEqualTo("Nails");
        assertThat(result.portfolioImages()).containsExactly(image);
        verify(staffRepository).buscarDetalleBase(idStaff);
        verify(staffPortfolioImageRepository).listarPortfolioLigero(idStaff);
    }

    @Test
    void actualizarFotoPropiaPersisteUrlAzureEnCliente() {
        ClienteModel cliente = new ClienteModel();
        MultipartFile file = mock(MultipartFile.class);
        String imageUrl = "https://example.blob.core.windows.net/stylebeauty/perfiles/clientes/foto.webp";
        when(personaRepository.findByIdAuth("auth-1")).thenReturn(Optional.of(cliente));
        when(azureBlobStorageService.replace(null, file, "perfiles/clientes")).thenReturn(imageUrl);
        when(personaRepository.save(cliente)).thenReturn(cliente);

        PersonaModel actualizado = service.actualizarFotoPropia("auth-1", file);

        assertThat(actualizado).isSameAs(cliente);
        assertThat(cliente.getFotoUrl()).isEqualTo(imageUrl);
        verify(personaRepository).save(cliente);
    }

    @Test
    void actualizarPerfilComoAdminRechazaFotoBase64EnJson() {
        StaffModel staff = new StaffModel();
        PerfilRequestDTO dto = new PerfilRequestDTO();
        dto.setFotoUrl("data:image/png;base64,AAA");
        when(personaRepository.findByIdAuth("staff-auth")).thenReturn(Optional.of(staff));

        assertThatThrownBy(() -> service.actualizarPerfilComoAdmin("staff-auth", dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("imagen");
    }

    private PerfilRequestDTO clienteDto() {
        PerfilRequestDTO dto = new PerfilRequestDTO();
        dto.setIdAuth("auth-1");
        dto.setTipoPerfil("cliente");
        dto.setRut("12.345.678-5");
        dto.setNombre("Cliente");
        dto.setEmailContacto("CLIENTE@TEST.CL");
        dto.setTelefono("+56 9 1234 5678");
        dto.setFechaNacimiento(LocalDate.now().minusYears(20));
        dto.setGenero("femenino");
        return dto;
    }
}
