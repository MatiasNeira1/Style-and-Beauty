package com.style.beauty.ms_agenda;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MsAgendaApplication {

	public static void main(String[] args) {
		SpringApplication.run(MsAgendaApplication.class, args);
	}

}
