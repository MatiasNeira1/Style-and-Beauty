package com.style.beauty.ms_cliente;

import com.style.beauty.ms_cliente.model.EspecialidadModel;
import com.style.beauty.ms_cliente.repository.EspecialidadRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

@SpringBootApplication
public class MsClienteApplication {

	private record EspecialidadSeed(String nombre, String descripcion) {}

	private static final List<EspecialidadSeed> ESPECIALIDADES_BASE = List.of(
			new EspecialidadSeed("Peluqueria", "Servicios de peluqueria, tratamiento y asesoria de estilo."),
			new EspecialidadSeed("Nails", "Manicure, nail art, esmaltado y cuidado de unas."),
			new EspecialidadSeed("Cabello", "Corte, coloracion, peinado y cuidado capilar."),
			new EspecialidadSeed("Cuidados de la piel", "Limpiezas, tratamientos faciales y cuidado dermatocosmetico."),
			new EspecialidadSeed("Spa", "Servicios de relajacion, bienestar y cuidado corporal."),
			new EspecialidadSeed("Maquillaje", "Maquillaje social, profesional y asesoria de imagen.")
	);

	public static void main(String[] args) {
		SpringApplication.run(MsClienteApplication.class, args);
	}

	@Bean
	public CommandLineRunner seedData(EspecialidadRepository especialidadRepository) {
		return args -> {
			int creadas = 0;

			for (EspecialidadSeed seed : ESPECIALIDADES_BASE) {
				if (!especialidadRepository.existsByNombreIgnoreCase(seed.nombre())) {
					EspecialidadModel especialidad = new EspecialidadModel();
					especialidad.setNombre(seed.nombre());
					especialidad.setDescripcion(seed.descripcion());
					especialidadRepository.save(especialidad);
					creadas++;
				}
			}

			if (creadas > 0) {
				System.out.println("Especialidades sincronizadas: " + creadas + " nuevas.");
			}
		};
	}

}
