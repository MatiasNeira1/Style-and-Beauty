package com.style.beauty.ms_cliente.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.style.beauty.ms_cliente.dto.ContactMessageRequest;
import com.style.beauty.ms_cliente.service.ContactMessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    private final ContactMessageService contactMessageService;

    public ContactController(ContactMessageService contactMessageService) {
        this.contactMessageService = contactMessageService;
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody ContactMessageRequest request) {
        try {
            String uid = authenticatedUid(authHeader);
            return ResponseEntity.status(HttpStatus.CREATED).body(contactMessageService.create(uid, request));
        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token inválido o expirado.");
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private String authenticatedUid(String authHeader) throws FirebaseAuthException {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new SecurityException("Falta el header Authorization.");
        }

        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(authHeader.substring(7));
        return decodedToken.getUid();
    }
}
