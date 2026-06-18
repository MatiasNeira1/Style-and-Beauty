package com.style.beauty.ms_cliente.controller;

import com.style.beauty.ms_cliente.dto.ContactMessageRequest;
import com.style.beauty.ms_cliente.service.ContactMessageService;
import com.style.beauty.ms_cliente.service.FirebaseTokenVerifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    private final ContactMessageService contactMessageService;
    private final FirebaseTokenVerifier firebaseTokenVerifier;

    public ContactController(ContactMessageService contactMessageService, FirebaseTokenVerifier firebaseTokenVerifier) {
        this.contactMessageService = contactMessageService;
        this.firebaseTokenVerifier = firebaseTokenVerifier;
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody ContactMessageRequest request) {
        try {
            String uid = firebaseTokenVerifier.verify(authHeader).getUid();
            return ResponseEntity.status(HttpStatus.CREATED).body(contactMessageService.create(uid, request));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("perfil no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
