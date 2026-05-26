package com.style.beauty.ms_cliente;

import com.style.beauty.ms_cliente.model.EspecialidadModel;
import com.style.beauty.ms_cliente.repository.EspecialidadRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MsClienteApplication {

	public static void main(String[] args) {
		SpringApplication.run(MsClienteApplication.class, args);
	}

	@Bean
	public CommandLineRunner seedData(EspecialidadRepository especialidadRepository) {
		return args -> {
			if (especialidadRepository.count() == 0) {
				EspecialidadModel e1 = new EspecialidadModel();
				e1.setNombre("Cosmetóloga");
				e1.setDescripcion("Especialista en cuidado de la piel.");
				especialidadRepository.save(e1);

				EspecialidadModel e2 = new EspecialidadModel();
				e2.setNombre("Peluquero/a");
				e2.setDescripcion("Corte y peinado capilar.");
				especialidadRepository.save(e2);

				EspecialidadModel e3 = new EspecialidadModel();
				e3.setNombre("Barbero/a");
				e3.setDescripcion("Corte y cuidado masculino.");
				especialidadRepository.save(e3);

				EspecialidadModel e4 = new EspecialidadModel();
				e4.setNombre("Colorista");
				e4.setDescripcion("Especialista en tinturas.");
				especialidadRepository.save(e4);

				System.out.println("🌱 Base de datos inicializada: Especialidades creadas con éxito.");
			}
		};
	}

}
