package com.style.beauty.ms_cliente.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.model.PersonaModel;
import com.style.beauty.ms_cliente.repository.PersonaRepository;
import com.style.beauty.ms_cliente.strategy.PerfilStrategy;
import com.style.beauty.ms_cliente.model.ClienteModel;
import com.style.beauty.ms_cliente.model.StaffModel;
import com.style.beauty.ms_cliente.model.EspecialidadModel;
import com.style.beauty.ms_cliente.repository.ClienteRepository;
import com.style.beauty.ms_cliente.repository.StaffRepository;
import com.style.beauty.ms_cliente.repository.EspecialidadRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PerfilService {
    private final PersonaRepository personaRepository;
    private final ClienteRepository clienteRepository;
    private final StaffRepository staffRepository;
    private final EspecialidadRepository especialidadRepository;
    private final Map<String, PerfilStrategy> estrategias = new HashMap<>();

    @Autowired
    public PerfilService(PersonaRepository personaRepository,
                         ClienteRepository clienteRepository,
                         StaffRepository staffRepository,
                         EspecialidadRepository especialidadRepository,
                         List<PerfilStrategy> listaEstrategias) {
        this.personaRepository = personaRepository;
        this.clienteRepository = clienteRepository;
        this.staffRepository = staffRepository;
        this.especialidadRepository = especialidadRepository;
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
        if (estaVacio(dto.getRut())) {
            throw new IllegalArgumentException("El RUT es obligatorio.");
        }
        if (estaVacio(dto.getNombre())) {
            throw new IllegalArgumentException("El nombre es obligatorio.");
        }
        if (estaVacio(dto.getEmailContacto())) {
            throw new IllegalArgumentException("El correo es obligatorio.");
        }
        if ("STAFF".equalsIgnoreCase(dto.getTipoPerfil()) && dto.getIdEspecialidad() == null) {
            throw new IllegalArgumentException("La especialidad es obligatoria para el Staff.");
        }

        dto.setRut(dto.getRut().trim());
        dto.setNombre(dto.getNombre().trim());
        dto.setEmailContacto(dto.getEmailContacto().trim().toLowerCase());
        dto.setTipoPerfil(dto.getTipoPerfil().trim().toUpperCase());
        if (dto.getIdAuth() != null) dto.setIdAuth(dto.getIdAuth().trim());
    }

    private void validarDisponibilidad(PerfilRequestDTO dto, boolean validarIdAuth) {
        if (validarIdAuth && personaRepository.existsByIdAuth(dto.getIdAuth())) {
            throw new RuntimeException("Ya existe un perfil asociado a este usuario.");
        }
        if (personaRepository.existsByRutIgnoreCase(dto.getRut())) {
            throw new RuntimeException("Ya existe un usuario con ese RUT.");
        }
        if (personaRepository.existsByEmailContactoIgnoreCase(dto.getEmailContacto())) {
            throw new RuntimeException("Ya existe un usuario con ese correo.");
        }
    }

    private boolean estaVacio(String valor) {
        return valor == null || valor.isBlank();
    }

    // 2. READ (Obtener Mi Perfil)
    public PersonaModel obtenerMiPerfil(String idAuth) {
        return personaRepository.findByIdAuth(idAuth)
                .orElseGet(() -> {
                    try {
                        com.google.firebase.auth.UserRecord userRecord = com.google.firebase.auth.FirebaseAuth.getInstance().getUser(idAuth);
                        String rol = (String) userRecord.getCustomClaims().get("rol");
                        
                        if ("STAFF".equalsIgnoreCase(rol) || "ADMIN".equalsIgnoreCase(rol)) {
                            System.out.println("⚠️ Perfil no encontrado para idAuth: " + idAuth + " con rol Firebase: " + rol + ". Creando perfil Staff por defecto.");
                            StaffModel nuevoStaff = new StaffModel();
                            nuevoStaff.setIdAuth(idAuth);
                            nuevoStaff.setRut("11111111-1");
                            nuevoStaff.setNombre("Profesional");
                            nuevoStaff.setApellidos("De Prueba");
                            nuevoStaff.setEmailContacto(userRecord.getEmail() != null ? userRecord.getEmail() : "stafftest@gmail.com");
                            nuevoStaff.setGenero("FEMENINO");
                            nuevoStaff.setHolguraCitaMinutos(15);
                            
                            List<EspecialidadModel> especialidades = especialidadRepository.findAll();
                            if (!especialidades.isEmpty()) {
                                nuevoStaff.setEspecialidad(especialidades.get(0));
                            }
                            
                            return personaRepository.save(nuevoStaff);
                        } else if ("CLIENTE".equalsIgnoreCase(rol)) {
                            System.out.println("⚠️ Perfil no encontrado para idAuth: " + idAuth + " con rol Firebase: CLIENTE. Creando perfil Cliente por defecto.");
                            ClienteModel nuevoCliente = new ClienteModel();
                            nuevoCliente.setIdAuth(idAuth);
                            nuevoCliente.setRut("22222222-2");
                            nuevoCliente.setNombre("Cliente");
                            nuevoCliente.setApellidos("De Prueba");
                            nuevoCliente.setEmailContacto(userRecord.getEmail() != null ? userRecord.getEmail() : "clientetest@gmail.com");
                            nuevoCliente.setGenero("FEMENINO");
                            nuevoCliente.setPuntosFidelidad(0);
                            
                            return personaRepository.save(nuevoCliente);
                        }
                    } catch (Exception e) {
                        System.err.println("Error al obtener información de Firebase para idAuth " + idAuth + ": " + e.getMessage());
                    }
                    
                    throw new RuntimeException("Perfil no encontrado en la base de datos.");
                });
    }

    // 2.1 READ (Listar Clientes - Solo para Staff/Admin)
    public List<ClienteModel> listarTodosLosClientes() {
        return clienteRepository.findAll();
    }

    public ClienteModel obtenerClientePorId(java.util.UUID idCliente) {
        return clienteRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado."));
    }

    // 2.2 READ (Listar Staff)
    public List<StaffModel> listarTodoElStaff() {
        return staffRepository.findAll();
    }

    public StaffModel obtenerStaffPorId(java.util.UUID idStaff) {
        return staffRepository.findById(idStaff)
                .orElseThrow(() -> new RuntimeException("Staff no encontrado."));
    }

    // 3. UPDATE (Actualizar datos del perfil)
    public PersonaModel actualizarMiPerfil(String idAuth, PerfilRequestDTO dto) {
        PersonaModel persona = obtenerMiPerfil(idAuth);

        // Actualizamos solo los datos que el usuario nos envíe
        if (dto.getRut() != null) persona.setRut(dto.getRut());
        if (dto.getNombre() != null) persona.setNombre(dto.getNombre());
        if (dto.getApellidos() != null) persona.setApellidos(dto.getApellidos());
        if (dto.getFechaNacimiento() != null) persona.setFechaNacimiento(dto.getFechaNacimiento());
        if (dto.getGenero() != null) persona.setGenero(dto.getGenero());
        if (dto.getTelefono() != null) persona.setTelefono(dto.getTelefono());
        if (dto.getEmailContacto() != null) persona.setEmailContacto(dto.getEmailContacto());
        if (persona instanceof StaffModel staff) {
            if (dto.getFotoUrl() != null) staff.setFotoUrl(dto.getFotoUrl());
            if (dto.getCvUrl() != null) staff.setCvUrl(dto.getCvUrl());
            if (dto.getDescripcionPerfil() != null) staff.setDescripcionPerfil(dto.getDescripcionPerfil());
            if (dto.getExperienciaAnios() != null) staff.setExperienciaAnios(dto.getExperienciaAnios());
            if (dto.getIdEspecialidad() != null) {
                EspecialidadModel especialidad = especialidadRepository.findById(dto.getIdEspecialidad())
                        .orElseThrow(() -> new IllegalArgumentException("No existe la especialidad con ID: " + dto.getIdEspecialidad()));
                staff.setEspecialidad(especialidad);
            }
        }
        
        // Guardamos los cambios
        return personaRepository.save(persona);
    }

    // 4. DELETE (Eliminar cuenta)
    public void eliminarMiPerfil(String idAuth) {
        PersonaModel persona = obtenerMiPerfil(idAuth);
        // Al eliminar la Persona, Hibernate eliminará automáticamente (Cascada)
        // su registro en Cliente/Staff y su Ficha Técnica.
        personaRepository.delete(persona);
    
    }

}


