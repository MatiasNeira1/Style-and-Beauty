package com.style.beauty.ms_catalogo.service;

import com.style.beauty.ms_catalogo.repository.CategoriaRepository;
import com.style.beauty.ms_catalogo.entity.Servicio;
import com.style.beauty.ms_catalogo.repository.ServicioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ServicioService {

    @Autowired
    private ServicioRepository repository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    public List<Servicio> listarTodos() {
        return repository.findAll().stream()
                .map(this::conHolguraCatalogo)
                .toList();
    }

    public Optional<Servicio> buscarPorId(UUID id) {
        return repository.findById(id).map(this::conHolguraCatalogo);
    }

    public List<Servicio> listarPorCategoria(String categoria) {
        return repository.findByCategoria(categoria).stream()
                .map(this::conHolguraCatalogo)
                .toList();
    }

    public Servicio guardar(Servicio servicio) {
        conHolguraCatalogo(servicio);
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
            existente.setHolgura_minutos(cambios.getHolgura_minutos());
            existente.setPrecio_total(cambios.getPrecio_total());
            existente.setMonto_fianza(cambios.getMonto_fianza());
            existente.setActivo(cambios.getActivo());
            conHolguraCatalogo(existente);
            return repository.save(existente);
        });
    }

    public void eliminar(UUID id) {
        repository.deleteById(id);
    }

    private Servicio conHolguraCatalogo(Servicio servicio) {
        if (servicio.getHolgura_minutos() == null || servicio.getHolgura_minutos() < 0) {
            servicio.setHolgura_minutos(holguraPorCategoria(servicio.getCategoria(), servicio.getNombre()));
        }
        return servicio;
    }

    private int holguraPorCategoria(String categoria, String nombre) {
        if (categoria != null && !categoria.isBlank()) {
            Optional<Integer> holguraCatalogo = categoriaRepository.findByNombreIgnoreCase(categoria.trim())
                    .map(valor -> valor.getHolgura());
            if (holguraCatalogo.isPresent()) {
                return holguraCatalogo.get();
            }
        }

        String texto = normalizar((categoria == null ? "" : categoria) + " " + (nombre == null ? "" : nombre));

        if (contieneAlguno(texto, "cabello", "peluqueria", "barber", "corte", "color")) {
            return 30;
        }
        if (contieneAlguno(texto, "maquillaje")) {
            return 15;
        }
        if (contieneAlguno(texto, "nails", "unas", "manicure", "pedicure")) {
            return 15;
        }
        if (contieneAlguno(texto, "cuidados de la piel", "piel", "facial", "estetica")) {
            return 20;
        }
        if (contieneAlguno(texto, "spa", "masaje", "masoterapia")) {
            return 30;
        }

        return 20;
    }

    private boolean contieneAlguno(String texto, String... valores) {
        for (String valor : valores) {
            if (texto.contains(valor)) {
                return true;
            }
        }
        return false;
    }

    private String normalizar(String texto) {
        return Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
    }
}
