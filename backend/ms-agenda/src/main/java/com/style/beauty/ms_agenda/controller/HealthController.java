package com.style.beauty.ms_agenda.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping({"/", "/health"})
    public Map<String, String> health() {
        return Map.of(
                "service", "ms-agenda",
                "status", "UP"
        );
    }
}
