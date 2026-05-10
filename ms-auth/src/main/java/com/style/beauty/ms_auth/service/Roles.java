package com.style.beauty.ms_auth.service;

public enum Roles {
    ADMIN,
    STAFF,
    CLIENTE;

    public static boolean isValid(String rol) {
        if (rol == null) return false;
        try {
            Roles.valueOf(rol);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
