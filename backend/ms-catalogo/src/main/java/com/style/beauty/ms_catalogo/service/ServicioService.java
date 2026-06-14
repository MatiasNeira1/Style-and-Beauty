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

    private static final int MINUTOS_ATENCION_MINIMA = 5;
    private static final Map<String, Integer> HOLGURA_POR_CATEGORIA = Map.of(
            "cabello", 30,
            "maquillaje", 15,
            "nails", 15,
            "piel", 20,
            "spa", 30
    );

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
            if (servicio.getImagenUrl() != null && !servicio.getImagenUrl().isBlank()) {
                azureBlobStorageService.delete(servicio.getImagenUrl());
            }
            servicio.setImagenUrl(null);
            return repository.save(servicio);
        });
    }

    public void eliminar(UUID id) {
        repository.deleteById(id);
    }

    private void prepararServicio(Servicio servicio) {

        if (servicio.getActivo() == null) {
            servicio.setActivo(true);
        }

        if (servicio.getHolgura_minutos() == null) {
            Integer holguraCategoria = obtenerHolguraCategoria(servicio.getCategoria());

            if (holguraCategoria == null) {
                throw new RuntimeException("El servicio no tiene holgura configurada y la categoría tampoco tiene holgura por defecto");
            }

            servicio.setHolgura_minutos(holguraCategoria);
        }

        if (servicio.getDuracion_minutos() != null
                && servicio.getDuracion_minutos() > 0
                && servicio.getHolgura_minutos() != null
                && servicio.getHolgura_minutos() >= servicio.getDuracion_minutos()) {
            servicio.setHolgura_minutos(ajustarHolguraSegura(
                    servicio.getDuracion_minutos(),
                    servicio.getHolgura_minutos()
            ));
        }
    }

    private Integer obtenerHolguraCategoria(String categoria) {

        if (categoria == null || categoria.isBlank()) {
            return null;
        }

        Integer holguraPersistida = categoriaRepository.findByNombreIgnoreCase(categoria.trim())
                .map(categoriaEncontrada -> categoriaEncontrada.getHolgura())
                .orElse(null);

        if (holguraPersistida != null) {
            return holguraPersistida;
        }

        return holguraPorCategoria(categoria);
    }

    private void validarServicio(Servicio servicio) {

        if (servicio.getNombre() == null || servicio.getNombre().isBlank()) {
            throw new RuntimeException("El nombre del servicio es obligatorio");
        }

        if (servicio.getCategoria() == null || servicio.getCategoria().isBlank()) {
            throw new RuntimeException("La categoría del servicio es obligatoria");
        }

        if (servicio.getDuracion_minutos() == null || servicio.getDuracion_minutos() <= 0) {
            throw new RuntimeException("La duración del servicio debe ser mayor a 0");
        }

        if (servicio.getHolgura_minutos() == null) {
            throw new RuntimeException("La holgura del servicio es obligatoria");
        }

        if (servicio.getHolgura_minutos() < 0) {
            throw new RuntimeException("La holgura del servicio no puede ser negativa");
        }

        if (servicio.getPrecio_total() == null || servicio.getPrecio_total() < 0) {
            throw new RuntimeException("El precio total del servicio debe ser válido");
        }

        if (servicio.getMonto_fianza() == null || servicio.getMonto_fianza() < 0) {
            throw new RuntimeException("El monto de fianza debe ser válido");
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

    private Integer holguraPorCategoria(String categoria) {
        String normalizada = normalizarCategoria(categoria);

        if (normalizada == null) {
            return null;
        }

        if (normalizada.contains("cabello") || normalizada.contains("peluqueria")) {
            return HOLGURA_POR_CATEGORIA.get("cabello");
        }

        if (normalizada.contains("maquillaje")) {
            return HOLGURA_POR_CATEGORIA.get("maquillaje");
        }

        if (normalizada.contains("nails") || normalizada.contains("manicure") || normalizada.contains("unas")) {
            return HOLGURA_POR_CATEGORIA.get("nails");
        }

        if (normalizada.contains("piel") || normalizada.contains("facial")) {
            return HOLGURA_POR_CATEGORIA.get("piel");
        }

        if (normalizada.contains("spa")) {
            return HOLGURA_POR_CATEGORIA.get("spa");
        }

        return null;
    }

    private String normalizarCategoria(String categoria) {
        if (categoria == null || categoria.isBlank()) {
            return null;
        }

        String sinAcentos = Normalizer.normalize(categoria.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinAcentos.toLowerCase(Locale.ROOT);
    }

    private int ajustarHolguraSegura(int duracion, int holgura) {
        if (holgura < duracion) {
            return holgura;
        }

        return Math.max(0, duracion - MINUTOS_ATENCION_MINIMA);
    }
}
