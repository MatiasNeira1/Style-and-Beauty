package com.style.beauty.ms_cliente.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.model.PersonaModel;
import com.style.beauty.ms_cliente.repository.PersonaRepository;
import com.style.beauty.ms_cliente.strategy.PerfilStrategy;
import com.style.beauty.ms_cliente.model.ClienteModel;
import com.style.beauty.ms_cliente.model.StaffModel;
import com.style.beauty.ms_cliente.repository.ClienteRepository;
import com.style.beauty.ms_cliente.repository.StaffRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PerfilService {
    private final PersonaRepository personaRepository;
    private final ClienteRepository clienteRepository;
    private final StaffRepository staffRepository;
    private final Map<String, PerfilStrategy> estrategias = new HashMap<>();

    @Autowired
    public PerfilService(PersonaRepository personaRepository,
                         ClienteRepository clienteRepository,
                         StaffRepository staffRepository,
                         List<PerfilStrategy> listaEstrategias) {
        this.personaRepository = personaRepository;
        this.clienteRepository = clienteRepository;
        this.staffRepository = staffRepository;
        // Arma el diccionario de estrategias leyendo los "letreros"
        for (PerfilStrategy estrategia : listaEstrategias) {
            estrategias.put(estrategia.getTipoPerfil().toUpperCase(), estrategia);
        }
    }
    // Metodo para registrar un nuevo perfil==============================================================================
    public PersonaModel registrarNuevoPerfil(PerfilRequestDTO dto) {
        // Evitamos que alguien se registre dos veces
        if (personaRepository.findByIdAuth(dto.getIdAuth()).isPresent()) {
            throw new RuntimeException("El perfil ya existe en la base de datos.");
        }
         

        // Buscamos a la estrategia encargada
        PerfilStrategy estrategiaSeleccionada = estrategias.get(dto.getTipoPerfil().toUpperCase());

        if (estrategiaSeleccionada == null) {
            throw new IllegalArgumentException("No hay una estrategia para el rol: " + dto.getTipoPerfil());
        }

        // Ejecutamos el guardado
        return estrategiaSeleccionada.crearPerfil(dto); }

        // 2. READ (Obtener Mi Perfil)
    public PersonaModel obtenerMiPerfil(String idAuth) {
        return personaRepository.findByIdAuth(idAuth)
                .orElseThrow(() -> new RuntimeException("Perfil no encontrado en la base de datos."));
    }

    // 2.1 READ (Listar Clientes - Solo para Staff/Admin)
    public List<ClienteModel> listarTodosLosClientes() {
        return clienteRepository.findAll();
    }

    // 2.2 READ (Listar Staff)
    public List<StaffModel> listarTodoElStaff() {
        return staffRepository.findAll();
    }

    // 3. UPDATE (Actualizar datos del perfil)
    public PersonaModel actualizarMiPerfil(String idAuth, PerfilRequestDTO dto) {
        PersonaModel persona = obtenerMiPerfil(idAuth);

        // Actualizamos solo los datos que el usuario nos envíe
        if (dto.getNombre() != null) persona.setNombre(dto.getNombre());
        if (dto.getApellidos() != null) persona.setApellidos(dto.getApellidos());
        if (dto.getTelefono() != null) persona.setTelefono(dto.getTelefono());
        if (dto.getEmailContacto() != null) persona.setEmailContacto(dto.getEmailContacto());
        
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


