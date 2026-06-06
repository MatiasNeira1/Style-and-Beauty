package com.style.beauty.ms_catalogo.service;

import com.style.beauty.ms_catalogo.entity.Categoria;
import com.style.beauty.ms_catalogo.repository.CategoriaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CategoriaService {

    private final CategoriaRepository repository;

    public CategoriaService(CategoriaRepository repository) {
        this.repository = repository;
    }

    public List<Categoria> listarTodas() {
        return repository.findAll();
    }

    public Optional<Categoria> buscarPorId(Long id) {
        return repository.findById(id);
    }

    public Categoria guardar(Categoria categoria) {
        validar(categoria);
        return repository.save(categoria);
    }

    @Transactional
    public Optional<Categoria> actualizar(Long id, Categoria cambios) {
        return repository.findById(id).map(existente -> {
            existente.setNombre(cambios.getNombre());
            existente.setHolgura(cambios.getHolgura());
            validar(existente);
            return repository.save(existente);
        });
    }

    public void eliminar(Long id) {
        repository.deleteById(id);
    }

    private void validar(Categoria categoria) {
        if (categoria.getNombre() == null || categoria.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre de la categoria es obligatorio");
        }
        if (categoria.getHolgura() == null || categoria.getHolgura() < 0) {
            throw new IllegalArgumentException("La holgura de la categoria debe ser mayor o igual a 0");
        }
    }
}
