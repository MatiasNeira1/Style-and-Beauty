package com.style.beauty.Api_gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@SpringBootApplication
public class ApiGatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiGatewayApplication.class, args);
	}

	@Bean
	public CorsWebFilter corsWebFilter() {
		CorsConfiguration corsConfig = new CorsConfiguration();
		
		String corsAllowedOrigins = System.getenv("CORS_ALLOWED_ORIGINS");
		if (corsAllowedOrigins == null || corsAllowedOrigins.isBlank()) {
			corsAllowedOrigins = System.getenv("APP_CORS_ALLOWED_ORIGINS");
		}
		
		if (corsAllowedOrigins != null && !corsAllowedOrigins.isBlank()) {
			String[] origins = corsAllowedOrigins.split(",");
			for (String origin : origins) {
				corsConfig.addAllowedOrigin(origin.trim());
			}
		} else {
			corsConfig.addAllowedOrigin("https://styleandbeauty.me");
			corsConfig.addAllowedOrigin("https://www.styleandbeauty.me");
			corsConfig.addAllowedOrigin("http://localhost");
			corsConfig.addAllowedOrigin("http://localhost:80");
			corsConfig.addAllowedOrigin("http://localhost:5173");
			corsConfig.addAllowedOrigin("http://127.0.0.1");
			corsConfig.addAllowedOrigin("http://127.0.0.1:80");
			corsConfig.addAllowedOrigin("http://127.0.0.1:5173");
		}

		corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		corsConfig.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
		corsConfig.setAllowCredentials(true);
		corsConfig.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", corsConfig);

		return new CorsWebFilter(source);
	}
}
