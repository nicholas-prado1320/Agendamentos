package com.nicholas.backend.domain.service;

import com.nicholas.backend.config.JwtService;
import com.nicholas.backend.domain.entity.Cliente;
import com.nicholas.backend.domain.entity.Usuario;
import com.nicholas.backend.domain.entity.UsuarioRole;
import com.nicholas.backend.domain.repository.ClienteRepository;
import com.nicholas.backend.domain.repository.UsuarioRepository;
import com.nicholas.backend.dto.request.ClienteRegisterRequest;
import com.nicholas.backend.dto.request.LoginRequest;
import com.nicholas.backend.dto.response.AuthResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final JwtService jwtService;

    public AuthResponse login(LoginRequest request) {
        var authenticationToken = new UsernamePasswordAuthenticationToken(
                request.email(),
                request.senha()
        );

        var authentication = authenticationManager.authenticate(authenticationToken);

        Usuario usuario = (Usuario) authentication.getPrincipal();

        String token = jwtService.gerarToken(usuario);

        return toResponse(usuario, token);
    }

    public AuthResponse registrarCliente(ClienteRegisterRequest request) {
        validarEmailDisponivel(request.email());

        Cliente cliente = Cliente.builder()
                .nomeCompleto(request.nomeCompleto())
                .apelido(request.apelido())
                .whatsapp(request.whatsapp())
                .build();

        Cliente clienteSalvo = clienteRepository.save(cliente);

        Usuario usuario = Usuario.builder()
                .nome(request.nomeCompleto())
                .email(request.email().trim().toLowerCase())
                .senha(passwordEncoder.encode(request.senha()))
                .role(UsuarioRole.CLIENTE)
                .cliente(clienteSalvo)
                .build();

        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        String token = jwtService.gerarToken(usuarioSalvo);

        return toResponse(usuarioSalvo, token);
    }

    private void validarEmailDisponivel(String email) {
        boolean emailExiste = usuarioRepository.existsByEmailIgnoreCase(email);

        if (emailExiste) {
            throw new RuntimeException("Este e-mail já está cadastrado.");
        }
    }

    private AuthResponse toResponse(Usuario usuario, String token) {
        return new AuthResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getRole(),
                usuario.getCliente() != null ? usuario.getCliente().getId() : null,
                token
        );
    }
}