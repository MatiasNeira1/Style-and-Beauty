package com.style.beauty.ms_auth.controller;

import jakarta.validation.constraints.NotBlank;


public class RoleRequest {
    @NotBlank(message = "uid is requerido")
    private String uid;

    @NotBlank(message = "rol is requerido")
    private String rol;

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }
}
