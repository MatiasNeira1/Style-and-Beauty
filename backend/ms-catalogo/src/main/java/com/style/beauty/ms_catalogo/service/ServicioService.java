package com.style.beauty.ms_catalogo.service;

import com.style.beauty.ms_catalogo.entity.Servicio;
import com.style.beauty.ms_catalogo.repository.ServicioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public Optional<Servicio> actualizar(UUID id, Servicio cambios) {
        return repository.findById(id).map(existente -> {
            existente.setNombre(cambios.getNombre());
            existente.setDescripcion(cambios.getDescripcion());
            existente.setDetallerservicio(cambios.getDetallerservicio());
            existente.setCategoria(cambios.getCategoria());
            existente.setManual_uso_url(cambios.getManual_uso_url());
            existente.setDuracion_minutos(cambios.getDuracion_minutos());
            existente.setPrecio_total(cambios.getPrecio_total());
            existente.setMonto_fianza(cambios.getMonto_fianza());
            existente.setActivo(cambios.getActivo());
            return repository.save(existente);
        });
    }

    public void eliminar(UUID id) {
        repository.deleteById(id);
    }
}
