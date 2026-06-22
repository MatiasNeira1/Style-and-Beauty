package com.style.beauty.ms_cliente.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.exception.DuplicateRutException;
import com.style.beauty.ms_cliente.exception.ProfileNotFoundException;
import com.style.beauty.ms_cliente.model.PersonaModel;
import com.style.beauty.ms_cliente.repository.PersonaRepository;
import com.style.beauty.ms_cliente.strategy.PerfilStrategy;
import com.style.beauty.ms_cliente.util.RutUtils;
import com.style.beauty.ms_cliente.model.ClienteModel;
import com.style.beauty.ms_cliente.model.EspecialidadModel;
import com.style.beauty.ms_cliente.model.StaffModel;
import com.style.beauty.ms_cliente.model.StaffPortfolioImageModel;
import com.style.beauty.ms_cliente.model.FichaTecnicaModel;
import com.style.beauty.ms_cliente.repository.ClienteRepository;
import com.style.beauty.ms_cliente.repository.EspecialidadRepository;
import com.style.beauty.ms_cliente.repository.StaffPortfolioImageRepository;
import com.style.beauty.ms_cliente.repository.StaffRepository;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class PerfilService {
    private static final int EDAD_MINIMA_CLIENTE = 15;
    private static final Set<String> GENEROS_VALIDOS = Set.of("femenino", "masculino", "otro", "no_especifica");
    private static final String RUT_INVALIDO = "El RUT ingresado no es válido.";
    private static final String RUT_DUPLICADO = "El RUT ingresado ya se encuentra registrado.";

    private final PersonaRepository personaRepository;
    private final ClienteRepository clienteRepository;
    private final StaffRepository staffRepository;
    private final StaffPortfolioImageRepository staffPortfolioImageRepository;
    private final EspecialidadRepository especialidadRepository;
    private final AzureBlobStorageService azureBlobStorageService;
    private final Map<String, PerfilStrategy> estrategias = new HashMap<>();

    @Value("${app.company-logo-url:${APP_COMPANY_LOGO_URL:https://stylebeautyimages.blob.core.windows.net/stylebeauty/logo.jpg}}")
    private String companyLogoUrl;

    @Autowired
    public PerfilService(PersonaRepository personaRepository,
                         ClienteRepository clienteRepository,
                         StaffRepository staffRepository,
                         StaffPortfolioImageRepository staffPortfolioImageRepository,
                         EspecialidadRepository especialidadRepository,
                         AzureBlobStorageService azureBlobStorageService,
                         List<PerfilStrategy> listaEstrategias) {
        this.personaRepository = personaRepository;
        this.clienteRepository = clienteRepository;
        this.staffRepository = staffRepository;
        this.staffPortfolioImageRepository = staffPortfolioImageRepository;
        this.especialidadRepository = especialidadRepository;
        this.azureBlobStorageService = azureBlobStorageService;
        // Arma el diccionario de estrategias leyendo los "letreros"
        for (PerfilStrategy estrategia : listaEstrategias) {
            estrategias.put(estrategia.getTipoPerfil().toUpperCase(), estrategia);
        }
    }
    // Metodo para registrar un nuevo perfil==============================================================================
    public PersonaModel registrarNuevoPerfil(PerfilRequestDTO dto) {
        validarDatosObligatorios(dto, true);
        validarDisponibilidad(dto, true);
         

        // Buscamos a la estrategia encargada
        PerfilStrategy estrategiaSeleccionada = estrategias.get(dto.getTipoPerfil().toUpperCase());

        if (estrategiaSeleccionada == null) {
            throw new IllegalArgumentException("No hay una estrategia para el rol: " + dto.getTipoPerfil());
        }

        // Ejecutamos el guardado
        return estrategiaSeleccionada.crearPerfil(dto); }

    public void validarDisponibilidadParaCreacion(PerfilRequestDTO dto) {
        validarDatosObligatorios(dto, false);
        validarDisponibilidad(dto, false);
    }

    private void validarDatosObligatorios(PerfilRequestDTO dto, boolean requiereIdAuth) {
        if (dto == null) {
            throw new IllegalArgumentException("Debes enviar los datos del usuario.");
        }
        if (requiereIdAuth && estaVacio(dto.getIdAuth())) {
            throw new IllegalArgumentException("El idAuth es obligatorio.");
        }
        if (estaVacio(dto.getTipoPerfil())) {
            throw new IllegalArgumentException("El tipo de perfil es obligatorio.");
        }
        dto.setTipoPerfil(dto.getTipoPerfil().trim().toUpperCase());

        if (estaVacio(dto.getRut())) {
            throw new IllegalArgumentException("El RUT es obligatorio.");
        }
        validarYNormalizarRut(dto);
        if (estaVacio(dto.getNombre())) {
            throw new IllegalArgumentException("El nombre es obligatorio.");
        }
        if (estaVacio(dto.getEmailContacto())) {
            throw new IllegalArgumentException("El correo es obligatorio.");
        }
        if ("STAFF".equalsIgnoreCase(dto.getTipoPerfil()) && dto.getIdEspecialidad() == null) {
            throw new IllegalArgumentException("La especialidad es obligatoria para el Staff.");
        }
        if ("CLIENTE".equalsIgnoreCase(dto.getTipoPerfil())) {
            validarFechaNacimientoCliente(dto.getFechaNacimiento());
            validarGeneroCliente(dto);
        }

        dto.setNombre(dto.getNombre().trim());
        dto.setEmailContacto(dto.getEmailContacto().trim().toLowerCase());
        if (dto.getIdAuth() != null) dto.setIdAuth(dto.getIdAuth().trim());
    }

    private void validarYNormalizarRut(PerfilRequestDTO dto) {
        if (!RutUtils.isValidRut(dto.getRut())) {
            throw new IllegalArgumentException(RUT_INVALIDO);
        }
        dto.setRut(RutUtils.normalizeRut(dto.getRut()));
    }

    private void validarFechaNacimientoCliente(LocalDate fechaNacimiento) {
        if (fechaNacimiento == null) {
            throw new IllegalArgumentException("La fecha de nacimiento es obligatoria.");
        }
        if (fechaNacimiento.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha de nacimiento no puede ser futura.");
        }
        if (fechaNacimiento.isAfter(LocalDate.now().minusYears(EDAD_MINIMA_CLIENTE))) {
            throw new IllegalArgumentException("Debes tener al menos 15 años para crear una cuenta.");
        }
    }

    private void validarGeneroCliente(PerfilRequestDTO dto) {
        if (estaVacio(dto.getGenero())) {
            throw new IllegalArgumentException("El género es obligatorio.");
        }

        String generoNormalizado = dto.getGenero().trim().toLowerCase();
        if (!GENEROS_VALIDOS.contains(generoNormalizado)) {
            throw new IllegalArgumentException("Selecciona una opción válida para género.");
        }

        dto.setGenero(generoNormalizado);
    }

    private void validarDisponibilidad(PerfilRequestDTO dto, boolean validarIdAuth) {
        if (validarIdAuth && personaRepository.existsByIdAuth(dto.getIdAuth())) {
            throw new RuntimeException("Ya existe un perfil asociado a este usuario.");
        }
        validarRutDisponible(dto.getRut(), null);
        if (personaRepository.existsByEmailContactoIgnoreCase(dto.getEmailContacto())) {
            throw new RuntimeException("Ya existe un usuario con ese correo.");
        }
    }

    private void validarRutDisponible(String rut, UUID idPersonaPermitida) {
        String rutCompacto = RutUtils.compactRut(rut);
        boolean duplicado = personaRepository.findAllByRutCompact(rutCompacto).stream()
                .anyMatch(persona -> idPersonaPermitida == null || !idPersonaPermitida.equals(persona.getIdPersona()));

        if (duplicado) {
            throw new DuplicateRutException(RUT_DUPLICADO);
        }
    }

    private boolean estaVacio(String valor) {
        return valor == null || valor.isBlank();
    }

        // 2. READ (Obtener Mi Perfil)
    public PersonaModel obtenerMiPerfil(String idAuth) {
        return personaRepository.findByIdAuth(idAuth)
                .orElseThrow(() -> new ProfileNotFoundException("Perfil no encontrado en la base de datos."));
    }

    // 2.1 READ (Listar Clientes - Solo para Staff/Admin)
    public List<ClienteModel> listarTodosLosClientes() {
        return clienteRepository.listarClientesRegistrados();
    }

    public ClienteModel obtenerClientePorId(java.util.UUID idCliente) {
        return clienteRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado."));
    }

    public ClienteModel obtenerClientePorAuthId(String idAuth) {
        PersonaModel persona = obtenerMiPerfil(idAuth);
        if (persona instanceof ClienteModel cliente) {
            return cliente;
        }
        throw new RuntimeException("El usuario autenticado no corresponde a un cliente.");
    }

    public StaffModel obtenerStaffPorAuthId(String idAuth) {
        PersonaModel persona = obtenerMiPerfil(idAuth);
        if (persona instanceof StaffModel staff) {
            return staff;
        }
        throw new RuntimeException("El usuario autenticado no corresponde a un staff.");
    }

    @Transactional
    public ClienteModel acumularPuntosFidelidad(java.util.UUID idCliente, int puntos) {
        if (puntos <= 0) {
            throw new IllegalArgumentException("Los puntos a acumular deben ser mayores a cero.");
        }
        ClienteModel cliente = obtenerClientePorId(idCliente);
        int puntosActuales = cliente.getPuntosFidelidad() == null ? 0 : cliente.getPuntosFidelidad();
        cliente.setPuntosFidelidad(puntosActuales + puntos);
        return clienteRepository.save(cliente);
    }

    // 2.2 READ (Listar Staff)
    public List<StaffModel> listarTodoElStaff() {
        return staffRepository.findAll().stream()
                .peek(this::prepararStaffPublico)
                .toList();
    }

    public StaffModel obtenerStaffPorId(java.util.UUID idStaff) {
        return staffRepository.findById(idStaff)
                .orElseThrow(() -> new RuntimeException("Staff no encontrado."));
    }

    public StaffModel obtenerStaffPorIdConFallback(java.util.UUID idStaff) {
        StaffModel staff = obtenerStaffPorId(idStaff);
        prepararStaffPublico(staff);
        return staff;
    }

    public List<StaffPortfolioImageModel> listarPortfolioStaff(java.util.UUID idStaff) {
        obtenerStaffPorId(idStaff);
        return staffPortfolioImageRepository.findByStaff_IdPersonaOrderByCreatedAtDesc(idStaff);
    }

    @Transactional
    public StaffPortfolioImageModel subirPortfolioStaff(java.util.UUID idStaff, MultipartFile file) {
        StaffModel staff = obtenerStaffPorId(idStaff);
        String imageUrl = azureBlobStorageService.upload(file, "profesionales/portfolio/" + idStaff);

        StaffPortfolioImageModel image = new StaffPortfolioImageModel();
        image.setStaff(staff);
        image.setUrlFoto(imageUrl);
        image.setNombreArchivo(file == null ? null : file.getOriginalFilename());

        return staffPortfolioImageRepository.save(image);
    }

    @Transactional
    public void eliminarPortfolioStaff(java.util.UUID idStaff, java.util.UUID idFoto) {
        StaffPortfolioImageModel image = staffPortfolioImageRepository.findById(idFoto)
                .orElseThrow(() -> new RuntimeException("Imagen de portfolio no encontrada."));

        if (image.getStaff() == null || !idStaff.equals(image.getStaff().getIdPersona())) {
            throw new RuntimeException("La imagen no pertenece al staff seleccionado.");
        }

        azureBlobStorageService.delete(image.getUrlFoto());
        staffPortfolioImageRepository.delete(image);
    }

    @Transactional
    public StaffModel actualizarFotoStaff(java.util.UUID idStaff, MultipartFile file) {
        StaffModel staff = obtenerStaffPorId(idStaff);
        String imageUrl = azureBlobStorageService.replace(staff.getFotoUrl(), file, "profesionales");
        staff.setFotoUrl(imageUrl);
        return staffRepository.save(staff);
    }

    @Transactional
    public StaffModel eliminarFotoStaff(java.util.UUID idStaff) {
        StaffModel staff = obtenerStaffPorId(idStaff);
        if (staff.getFotoUrl() != null && !staff.getFotoUrl().isBlank() && !esLogoCorporativo(staff.getFotoUrl())) {
            azureBlobStorageService.delete(staff.getFotoUrl());
        }
        staff.setFotoUrl(companyLogoUrl);
        return staffRepository.save(staff);
    }

    @Transactional(readOnly = true)
    public StaffModel actualizarEstadoStaff(java.util.UUID idStaff, boolean activo) {
        StaffModel staff = obtenerStaffPorIdConFallback(idStaff);
        staff.setActivo(true);
        return staff;
    }

    // 3. UPDATE (Actualizar datos del perfil)
    public PersonaModel actualizarMiPerfil(String idAuth, PerfilRequestDTO dto) {
        return actualizarPerfil(idAuth, dto, false);
    }

    @Transactional
    public PersonaModel actualizarFotoPropia(String idAuth, MultipartFile file) {
        PersonaModel persona = obtenerMiPerfil(idAuth);
        String fotoActual;
        String carpeta;

        if (persona instanceof ClienteModel cliente) {
            fotoActual = cliente.getFotoUrl();
            carpeta = "perfiles/clientes";
            String imageUrl = azureBlobStorageService.replace(fotoActual, file, carpeta);
            cliente.setFotoUrl(imageUrl);
        } else if (persona instanceof StaffModel staff) {
            fotoActual = esLogoCorporativo(staff.getFotoUrl()) ? null : staff.getFotoUrl();
            carpeta = "profesionales";
            String imageUrl = azureBlobStorageService.replace(fotoActual, file, carpeta);
            staff.setFotoUrl(imageUrl);
        } else {
            throw new IllegalArgumentException("El perfil actual no admite una foto de perfil.");
        }

        return personaRepository.save(persona);
    }

    public PersonaModel actualizarPerfilComoAdmin(String idAuth, PerfilRequestDTO dto) {
        return actualizarPerfil(idAuth, dto, true);
    }

    private PersonaModel actualizarPerfil(String idAuth, PerfilRequestDTO dto, boolean permitirEditarIdentidad) {
        PersonaModel persona = obtenerMiPerfil(idAuth);
        boolean puedeEditarIdentidad = permitirEditarIdentidad || persona instanceof StaffModel;

        if (puedeEditarIdentidad) {
            if (dto.getRut() != null) {
                if (estaVacio(dto.getRut())) {
                    throw new IllegalArgumentException("El RUT es obligatorio.");
                }
                if (!RutUtils.isValidRut(dto.getRut())) {
                    throw new IllegalArgumentException(RUT_INVALIDO);
                }
                String rutNormalizado = RutUtils.normalizeRut(dto.getRut());
                validarRutDisponible(rutNormalizado, persona.getIdPersona());
                persona.setRut(rutNormalizado);
            }
            if (dto.getNombre() != null) persona.setNombre(dto.getNombre());
            if (dto.getApellidos() != null) persona.setApellidos(dto.getApellidos());
            if (dto.getFechaNacimiento() != null) persona.setFechaNacimiento(dto.getFechaNacimiento());
            if (dto.getGenero() != null) persona.setGenero(dto.getGenero());
            if (dto.getEmailContacto() != null) persona.setEmailContacto(dto.getEmailContacto());
        }

        if (dto.getTelefono() != null) persona.setTelefono(dto.getTelefono());
        if (persona instanceof StaffModel staff) {
            if (dto.getFotoUrl() != null && !dto.getFotoUrl().isBlank()) staff.setFotoUrl(dto.getFotoUrl());
            if (Boolean.TRUE.equals(dto.getSinImagenPorAhora()) && (staff.getFotoUrl() == null || staff.getFotoUrl().isBlank())) {
                staff.setFotoUrl(companyLogoUrl);
            }
            if (dto.getCvUrl() != null) staff.setCvUrl(dto.getCvUrl());
            if (dto.getDescripcionPerfil() != null) staff.setDescripcionPerfil(dto.getDescripcionPerfil());
            if (dto.getExperienciaAnios() != null) staff.setExperienciaAnios(dto.getExperienciaAnios());
            if (dto.getIdEspecialidad() != null) {
                EspecialidadModel especialidad = especialidadRepository.findById(dto.getIdEspecialidad())
                        .orElseThrow(() -> new IllegalArgumentException("No existe la especialidad con ID: " + dto.getIdEspecialidad()));
                staff.setEspecialidad(especialidad);
            }
        }
        
        // Actualizamos la ficha técnica si es cliente
        if (persona instanceof ClienteModel cliente) {
            FichaTecnicaModel ficha = cliente.getFichaTecnica();
            if (ficha == null) {
                ficha = new FichaTecnicaModel();
                ficha.setCliente(cliente);
                cliente.setFichaTecnica(ficha);
            }
            if (dto.getAlergias() != null) ficha.setAlergias(dto.getAlergias());
            if (dto.getMedicamentos() != null) ficha.setMedicamentos(dto.getMedicamentos());
            if (dto.getAfeccionesPiel() != null) ficha.setAfeccionesPiel(dto.getAfeccionesPiel());
        }
        
        // Guardamos los cambios
        return personaRepository.save(persona);
    }

    private boolean esLogoCorporativo(String fotoUrl) {
        return companyLogoUrl != null && companyLogoUrl.equals(fotoUrl);
    }

    private void aplicarFotoFallbackSiFalta(StaffModel staff) {
        if (staff.getFotoUrl() == null || staff.getFotoUrl().isBlank()) {
            staff.setFotoUrl(companyLogoUrl);
        }
    }

    private void prepararStaffPublico(StaffModel staff) {
        aplicarFotoFallbackSiFalta(staff);
        staff.setPortfolioImages(
                staffPortfolioImageRepository.findByStaff_IdPersonaOrderByCreatedAtDesc(staff.getIdPersona())
        );
    }

    // 4. DELETE (Eliminar cuenta)
    public void eliminarMiPerfil(String idAuth) {
        PersonaModel persona = obtenerMiPerfil(idAuth);
        // Al eliminar la Persona, Hibernate eliminará automáticamente (Cascada)
        // su registro en Cliente/Staff y su Ficha Técnica.
        personaRepository.delete(persona);
    
    }

}
