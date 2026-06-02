package com.nicholas.backend.domain.service;

import com.nicholas.backend.domain.entity.Usuario;
import com.nicholas.backend.domain.entity.UsuarioRole;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class UsuarioAutenticadoService {

    public Usuario getUsuario() {
        return (Usuario) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }

    public boolean isManicure() {
        return getUsuario().getRole() == UsuarioRole.MANICURE;
    }

    public boolean isCliente() {
        return getUsuario().getRole() == UsuarioRole.CLIENTE;
    }

    public Long getClienteId() {
        Usuario usuario = getUsuario();

        if (usuario.getCliente() == null) {
            return null;
        }

        return usuario.getCliente().getId();
    }
}