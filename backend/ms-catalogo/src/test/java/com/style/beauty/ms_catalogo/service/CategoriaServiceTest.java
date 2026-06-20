package com.style.beauty.ms_catalogo.service;

import com.style.beauty.ms_catalogo.entity.Categoria;
import com.style.beauty.ms_catalogo.repository.CategoriaRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CategoriaServiceTest {
    private final CategoriaRepository repository = mock(CategoriaRepository.class);
    private final CategoriaService service = new CategoriaService(repository);

    @Test
    void guardarValidaYPersisteCategoria() {
        Categoria categoria = categoria("Cabello", 30);
        when(repository.save(any(Categoria.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Categoria guardada = service.guardar(categoria);

        assertThat(guardada.getNombre()).isEqualTo("Cabello");
        assertThat(guardada.getHolgura()).isEqualTo(30);
    }

    @Test
    void guardarRechazaNombreVacio() {
        assertThatThrownBy(() -> service.guardar(categoria(" ", 10)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("nombre");
    }

    @Test
    void actualizarDevuelveOptionalVacioSiNoExiste() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThat(service.actualizar(1L, categoria("Nails", 15))).isEmpty();
    }

    @Test
    void eliminarDelegaEnRepositorio() {
        service.eliminar(9L);

        verify(repository).deleteById(9L);
    }

    private Categoria categoria(String nombre, Integer holgura) {
        Categoria categoria = new Categoria();
        categoria.setNombre(nombre);
        categoria.setHolgura(holgura);
        return categoria;
    }
}
