package com.style.beauty.ms_catalogo.service;

import com.style.beauty.ms_catalogo.entity.Servicio;
import com.style.beauty.ms_catalogo.repository.CategoriaRepository;
import com.style.beauty.ms_catalogo.repository.ServicioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class ServicioService {

    private static final double FIANZA_FUERA_HORARIO = 15_000D;
    private static final int HOLGURA_EXTERNA_MINUTOS = 15;

    @Autowired
    private ServicioRepository repository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private AzureBlobStorageService azureBlobStorageService;

    @Transactional(readOnly = true)
    public List<Servicio> listarTodos() {
        return repository.findByActivoTrue();
    }

    @Transactional(readOnly = true)
    public List<Servicio> listarTodosIncluyendoInactivos() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Servicio> buscarPorId(UUID id) {
        return repository.findById(id)
                .filter(servicio -> Boolean.TRUE.equals(servicio.getActivo()));
    }

    @Transactional(readOnly = true)
    public List<Servicio> listarPorCategoria(String categoria) {
        return repository.findByCategoriaIgnoreCaseAndActivoTrue(categoria);
    }

    public Servicio guardar(Servicio servicio) {
        prepararServicio(servicio);
        validarServicio(servicio);
        return repository.save(servicio);
    }

    @Transactional
    public Servicio guardarConImagen(
            String nombre,
            String descripcion,
            String detallerservicio,
            String categoria,
            String manualUsoUrl,
            Integer duracionMinutos,
            Integer duracionMinutosMin,
            Integer duracionMinutosMax,
            Integer holguraMinutos,
            Double precioTotal,
            Double montoFianza,
            Boolean activo,
            MultipartFile file) {
        Servicio servicio = new Servicio();
        servicio.setNombre(nombre);
        servicio.setDescripcion(descripcion);
        servicio.setDetallerservicio(detallerservicio);
        servicio.setCategoria(categoria);
        servicio.setManual_uso_url(manualUsoUrl);
        servicio.setDuracion_minutos(duracionMinutos);
        servicio.setDuracion_minutos_min(duracionMinutosMin);
        servicio.setDuracion_minutos_max(duracionMinutosMax);
        servicio.setHolgura_minutos(holguraMinutos);
        servicio.setPrecio_total(precioTotal);
        servicio.setMonto_fianza(montoFianza);
        servicio.setActivo(activo);

        prepararServicio(servicio);
        validarServicioBase(servicio);
        servicio.setImagenUrl(azureBlobStorageService.upload(file, "servicios"));
        validarServicio(servicio);
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
            if (cambios.getImagenUrl() != null) {
                existente.setImagenUrl(cambios.getImagenUrl());
            }
            existente.setDuracion_minutos(cambios.getDuracion_minutos());
            existente.setDuracion_minutos_min(cambios.getDuracion_minutos_min());
            existente.setDuracion_minutos_max(cambios.getDuracion_minutos_max());
            existente.setHolgura_minutos(cambios.getHolgura_minutos());
            existente.setPrecio_total(cambios.getPrecio_total());
            existente.setMonto_fianza(cambios.getMonto_fianza());
            existente.setActivo(cambios.getActivo());

            prepararServicio(existente);
            validarServicio(existente);

            return repository.save(existente);
        });
    }

    @Transactional
    public Optional<Servicio> actualizarImagen(UUID id, MultipartFile file) {
        return repository.findById(id).map(servicio -> {
            String imageUrl = azureBlobStorageService.replace(servicio.getImagenUrl(), file, "servicios");
            servicio.setImagenUrl(imageUrl);
            return repository.save(servicio);
        });
    }

    @Transactional
    public Optional<Servicio> eliminarImagen(UUID id) {
        return repository.findById(id).map(servicio -> {
            throw new IllegalArgumentException("Los servicios deben mantener una imagen publicada.");
        });
    }

    @Transactional
    public Optional<Servicio> cambiarEstado(UUID id, boolean activo) {
        return repository.findById(id).map(servicio -> {
            servicio.setActivo(activo);
            return repository.save(servicio);
        });
    }

    public void eliminar(UUID id) {
        repository.deleteById(id);
    }

    private void prepararServicio(Servicio servicio) {

        servicio.setMonto_fianza(FIANZA_FUERA_HORARIO);
        if (servicio.getNombre() != null && !servicio.getNombre().isBlank()
                && servicio.getCategoria() != null && !servicio.getCategoria().isBlank()) {
            servicio.setManual_uso_url("/servicios/" + slug(servicio.getCategoria()) + "/" + slug(servicio.getNombre()));
        }

        if (servicio.getActivo() == null) {
            servicio.setActivo(true);
        }

        normalizarRangoDuracion(servicio);
        servicio.setHolgura_minutos(HOLGURA_EXTERNA_MINUTOS);
    }

    private void validarServicio(Servicio servicio) {
        validarServicioBase(servicio);

        if (servicio.getImagenUrl() == null || servicio.getImagenUrl().isBlank()) {
            throw new IllegalArgumentException("La imagen del servicio es obligatoria");
        }
    }

    private void validarServicioBase(Servicio servicio) {

        if (servicio.getNombre() == null || servicio.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del servicio es obligatorio");
        }

        if (servicio.getCategoria() == null || servicio.getCategoria().isBlank()) {
            throw new IllegalArgumentException("La categoría del servicio es obligatoria");
        }

        if (servicio.getDuracion_minutos() == null || servicio.getDuracion_minutos() <= 0) {
            throw new IllegalArgumentException("La duración del servicio debe ser mayor a 0");
        }

        if (servicio.getDuracion_minutos_min() == null || servicio.getDuracion_minutos_min() <= 0) {
            throw new IllegalArgumentException("La duración mínima del servicio debe ser mayor a 0");
        }

        if (servicio.getDuracion_minutos_max() == null || servicio.getDuracion_minutos_max() <= 0) {
            throw new IllegalArgumentException("La duración máxima del servicio debe ser mayor a 0");
        }

        if (servicio.getDuracion_minutos_min() > servicio.getDuracion_minutos_max()) {
            throw new IllegalArgumentException("La duración mínima no puede ser mayor a la máxima");
        }

        if (servicio.getDuracion_minutos() < servicio.getDuracion_minutos_min()
                || servicio.getDuracion_minutos() > servicio.getDuracion_minutos_max()) {
            throw new IllegalArgumentException("La duración efectiva debe estar dentro del rango configurado");
        }

        if (servicio.getHolgura_minutos() == null) {
            throw new IllegalArgumentException("La holgura del servicio es obligatoria");
        }

        if (servicio.getHolgura_minutos() < 0) {
            throw new IllegalArgumentException("La holgura del servicio no puede ser negativa");
        }

        if (servicio.getPrecio_total() == null || servicio.getPrecio_total() < 0) {
            throw new IllegalArgumentException("El precio total del servicio debe ser válido");
        }

        if (servicio.getMonto_fianza() == null || servicio.getMonto_fianza() < 0) {
            throw new IllegalArgumentException("El monto de fianza debe ser válido");
        }
    }

    @Autowired
    private com.style.beauty.ms_catalogo.repository.ServicioStaffRepository servicioStaffRepository;

    @Value("${app.ms-perfiles.base-url:http://ms-perfiles:8082}")
    private String perfilesBaseUrl;

    @Transactional(readOnly = true)
    public List<Object> obtenerProfesionalesPorServicio(UUID idServicio) {
        List<UUID> idStaffs = servicioStaffRepository.findByIdServicioAndActivoTrue(idServicio).stream()
                .map(com.style.beauty.ms_catalogo.entity.ServicioStaff::getIdStaff)
                .toList();

        if (idStaffs.isEmpty()) {
            return List.of();
        }

        try {
            org.springframework.web.client.RestClient restClient = org.springframework.web.client.RestClient.create(perfilesBaseUrl);
            List<?> allStaff = restClient.get()
                    .uri("/api/perfiles/staff")
                    .retrieve()
                    .body(List.class);

            if (allStaff == null) {
                return List.of();
            }

            return allStaff.stream()
                    .filter(member -> {
                        if (member instanceof java.util.Map) {
                            java.util.Map<?, ?> map = (java.util.Map<?, ?>) member;
                            Object idVal = map.get("idPersona");
                            if (idVal == null) idVal = map.get("idStaff");
                            if (idVal == null) idVal = map.get("id");
                            if (idVal != null) {
                                try {
                                    UUID uuid = UUID.fromString(idVal.toString());
                                    return idStaffs.contains(uuid);
                                } catch (Exception e) {
                                    return false;
                                }
                            }
                        }
                        return false;
                    })
                    .map(member -> (Object) member)
                    .toList();
        } catch (Exception e) {
            System.err.println("Error calling ms-perfiles: " + e.getMessage());
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public List<Object> obtenerProfesionalesPorNombreServicio(String nombre) {
        Optional<Servicio> servicioOpt = repository.findAll().stream()
                .filter(s -> s.getNombre().equalsIgnoreCase(nombre.trim()))
                .findFirst();
        if (servicioOpt.isPresent()) {
            return obtenerProfesionalesPorServicio(servicioOpt.get().getId_servicio());
        }
        return List.of();
    }

    private String normalizarCategoria(String categoria) {
        if (categoria == null || categoria.isBlank()) {
            return null;
        }

        String sinAcentos = Normalizer.normalize(categoria.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinAcentos.toLowerCase(Locale.ROOT);
    }

    private String slug(String value) {
        return Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private void normalizarRangoDuracion(Servicio servicio) {
        Integer duracion = servicio.getDuracion_minutos();
        Integer min = servicio.getDuracion_minutos_min();
        Integer max = servicio.getDuracion_minutos_max();

        if (min == null && max == null) {
            min = duracion;
            max = duracion;
        } else if (min == null) {
            min = duracion != null ? Math.min(duracion, max) : max;
        } else if (max == null) {
            max = duracion != null ? Math.max(duracion, min) : min;
        }

        if (duracion == null && max != null) {
            duracion = max;
        }

        if (duracion != null && min != null && max != null) {
            duracion = Math.max(min, Math.min(duracion, max));
        }

        servicio.setDuracion_minutos_min(min);
        servicio.setDuracion_minutos_max(max);
        servicio.setDuracion_minutos(duracion);
    }
}
