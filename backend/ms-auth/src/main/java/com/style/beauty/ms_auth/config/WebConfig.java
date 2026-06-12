package com.style.beauty.ms_auth.config;

import com.style.beauty.ms_auth.security.FirebaseAuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new FirebaseAuthInterceptor())
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/registrar-cliente");
    }
}
