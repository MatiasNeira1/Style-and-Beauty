package com.style.beauty.ms_catalogo.service;

import com.style.beauty.ms_catalogo.entity.Servicio;
import com.style.beauty.ms_catalogo.repository.CategoriaRepository;
import com.style.beauty.ms_catalogo.repository.ServicioRepository;
import com.style.beauty.ms_catalogo.repository.ServicioStaffRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ServicioServiceTest {
    private final ServicioRepository repository = mock(ServicioRepository.class);
    private final CategoriaRepository categoriaRepository = mock(CategoriaRepository.class);
    private final AzureBlobStorageService azureBlobStorageService = mock(AzureBlobStorageService.class);
    private final ServicioStaffRepository servicioStaffRepository = mock(ServicioStaffRepository.class);
    private final ServicioService service = new ServicioService();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "repository", repository);
        ReflectionTestUtils.setField(service, "categoriaRepository", categoriaRepository);
        ReflectionTestUtils.setField(service, "azureBlobStorageService", azureBlobStorageService);
        ReflectionTestUtils.setField(service, "servicioStaffRepository", servicioStaffRepository);
        when(repository.save(any(Servicio.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(categoriaRepository.findByNombreIgnoreCase(any())).thenReturn(Optional.empty());
    }

    @Test
    void listarTodosRetornaServiciosActivos() {
        Servicio servicio = servicioValido();
        when(repository.findByActivoTrue()).thenReturn(List.of(servicio));

        assertThat(service.listarTodos()).containsExactly(servicio);
    }

    @Test
    void guardarCompletaActivoYHolguraExternaGeneral() {
        Servicio servicio = servicioValido();
        servicio.setActivo(null);
        servicio.setHolgura_minutos(null);

        Servicio guardado = service.guardar(servicio);

        assertThat(guardado.getActivo()).isTrue();
        assertThat(guardado.getHolgura_minutos()).isEqualTo(15);
    }

    @Test
    void guardarNormalizaRangoDeDuracion() {
        Servicio servicio = servicioValido();
        servicio.setDuracion_minutos(150);
        servicio.setDuracion_minutos_min(90);
        servicio.setDuracion_minutos_max(120);

        Servicio guardado = service.guardar(servicio);

        assertThat(guardado.getDuracion_minutos()).isEqualTo(120);
        assertThat(guardado.getDuracion_minutos_min()).isEqualTo(90);
        assertThat(guardado.getDuracion_minutos_max()).isEqualTo(120);
    }

    @Test
    void guardarRechazaServicioSinImagen() {
        Servicio servicio = servicioValido();
        servicio.setImagenUrl("");

        assertThatThrownBy(() -> service.guardar(servicio))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("imagen");
    }

    private Servicio servicioValido() {
        Servicio servicio = new Servicio();
        servicio.setNombre("Corte");
        servicio.setCategoria("Cabello");
        servicio.setDuracion_minutos(60);
        servicio.setHolgura_minutos(15);
        servicio.setPrecio_total(15000.0);
        servicio.setMonto_fianza(5000.0);
        servicio.setImagenUrl("https://img.test/corte.jpg");
        servicio.setActivo(true);
        return servicio;
    }
}
