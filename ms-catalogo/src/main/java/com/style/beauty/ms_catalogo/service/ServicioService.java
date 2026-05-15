package com.style.beauty.ms_catalogo.service;

import com.style.beauty.ms_catalogo.entity.Servicio;
import com.style.beauty.ms_catalogo.repository.ServicioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ServicioService {

    @Autowired
    private ServicioRepository repository;

    public List<Servicio> listarTodos() {
        return repository.findAll();
    }

    public Optional<Servicio> buscarPorId(UUID id) {
        return repository.findById(id);
    }

    public List<Servicio> listarPorCategoria(String categoria) {
        return repository.findByCategoria(categoria);
    }

    public Servicio guardar(Servicio servicio) {
        return repository.save(servicio);
    }

    public void eliminar(UUID id) {
        repository.deleteById(id);
    }
}