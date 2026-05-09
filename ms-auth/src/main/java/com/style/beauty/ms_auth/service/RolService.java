package com.style.beauty.ms_auth.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service

public class RolService {
    /**
     
     * @param uid Este id lo genera firebase cuando se crea un usuario
     * @param rol El rol a asignar ("STAFF", "CLIENTE", "ADMIN")
     */
    public void assignRoleToUser(String uid, String rol) throws FirebaseAuthException {
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("rol", rol);

        
        FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
        
        System.out.println(" Rol " + rol + " asignado correctamente al UID: " + uid);
    }
}

