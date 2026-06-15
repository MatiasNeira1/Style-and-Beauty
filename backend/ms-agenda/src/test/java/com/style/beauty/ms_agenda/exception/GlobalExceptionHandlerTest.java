package com.style.beauty.ms_agenda.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    @Test
    void genericExceptionExponeStacktraceSoloEnPerfilTest() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("test");
        GlobalExceptionHandler handler = new GlobalExceptionHandler(environment);
        MockHttpServletRequest request = new MockHttpServletRequest(
                "POST",
                "/api/agenda/citas/disponibilidad"
        );

        ResponseEntity<ApiError> response = handler.handleGeneric(
                new IllegalStateException("boom"),
                request
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getDetails())
                .hasSize(1)
                .first()
                .asString()
                .contains("java.lang.IllegalStateException: boom");
    }

    @Test
    void rutaInexistenteRespondeNotFoundNoInternalServerError() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler(new MockEnvironment());
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/agenda");

        ResponseEntity<ApiError> response = handler.handleNoResourceFound(
                new NoResourceFoundException(HttpMethod.GET, "/api/agenda"),
                request
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("RESOURCE_NOT_FOUND");
    }
}
