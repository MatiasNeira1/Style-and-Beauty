package com.style.beauty.Api_gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiGatewayApplicationTests {

	@LocalServerPort
	private int port;

	@Test
	void contextLoads() {
	}

	@Test
	void corsPreflightReturnsSingleAllowedOriginHeader() {
		WebTestClient client = WebTestClient.bindToServer()
				.baseUrl("http://127.0.0.1:" + port)
				.build();

		EntityExchangeResult<byte[]> result = client.options()
				.uri("/api/servicio/test")
				.header(HttpHeaders.ORIGIN, "https://styleandbeauty.me")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
				.exchange()
				.expectStatus().isOk()
				.expectBody()
				.returnResult();

		List<String> allowedOrigins = result.getResponseHeaders().get(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);

		assertThat(allowedOrigins).containsExactly("https://styleandbeauty.me");
	}

}
