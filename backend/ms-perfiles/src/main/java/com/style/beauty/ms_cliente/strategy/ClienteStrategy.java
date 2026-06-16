package com.style.beauty.ms_cliente.strategy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.style.beauty.ms_cliente.dto.PerfilRequestDTO;
import com.style.beauty.ms_cliente.model.PersonaModel;
import com.style.beauty.ms_cliente.repository.ClienteRepository;
import com.style.beauty.ms_cliente.repository.FichaTecnicaRepository;
import com.style.beauty.ms_cliente.model.ClienteModel;
import com.style.beauty.ms_cliente.model.FichaTecnicaModel;

@Component
public class ClienteStrategy implements PerfilStrategy {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private FichaTecnicaRepository fichaTecnicaRepository;
    @Override

    public String getTipoPerfil() {
        return "CLIENTE";
    }

    @Override
    public PersonaModel crearPerfil(PerfilRequestDTO dto) {
        // aqui se crea al cliente
        ClienteModel cliente = new ClienteModel();
        cliente.setIdAuth(dto.getIdAuth());
        cliente.setRut(dto.getRut());
        cliente.setNombre(dto.getNombre());
        cliente.setApellidos(dto.getApellidos());
        cliente.setFechaNacimiento(dto.getFechaNacimiento());
        cliente.setGenero(dto.getGenero());
        cliente.setTelefono(dto.getTelefono());
        cliente.setEmailContacto(dto.getEmailContacto());
        cliente.setPuntosFidelidad(0);

        // Creamos su Ficha Técnica vacía y establecemos la relación bidireccional
        FichaTecnicaModel ficha = new FichaTecnicaModel();
        ficha.setCliente(cliente);
        cliente.setFichaTecnica(ficha);

        return clienteRepository.save(cliente);
    }

}
