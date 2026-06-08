package com.nicholas.backend.domain.service;

import com.nicholas.backend.config.JwtService;
import com.nicholas.backend.domain.entity.Cliente;
import com.nicholas.backend.domain.entity.EmailVerificationCode;
import com.nicholas.backend.domain.entity.Usuario;
import com.nicholas.backend.domain.entity.UsuarioRole;
import com.nicholas.backend.domain.repository.ClienteRepository;
import com.nicholas.backend.domain.repository.EmailVerificationCodeRepository;
import com.nicholas.backend.domain.repository.UsuarioRepository;
import com.nicholas.backend.dto.request.AlterarSenhaRequest;
import com.nicholas.backend.dto.request.ClienteRegisterRequest;
import com.nicholas.backend.dto.request.EsqueciSenhaRequest;
import com.nicholas.backend.dto.request.LoginRequest;
import com.nicholas.backend.dto.request.ValidarEmailRequest;
import com.nicholas.backend.dto.request.ReenviarCodigoEmailRequest;
import com.nicholas.backend.dto.request.GoogleCompletarCadastroRequest;
import com.nicholas.backend.dto.request.GoogleLoginRequest;
import com.nicholas.backend.dto.response.GoogleAuthResponse;
import com.nicholas.backend.dto.response.AuthResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.security.SecureRandom;
import java.time.LocalDateTime;

@RequiredArgsConstructor
@Service
public class AuthService {

    private static final int MIN_CODIGO = 100000;
    private static final int MAX_CODIGO = 999999;
    private static final String CARACTERES_SENHA = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$";

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final EmailVerificationCodeRepository emailVerificationCodeRepository;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final GoogleTokenService googleTokenService;

    private final SecureRandom secureRandom = new SecureRandom();

    public AuthResponse login(LoginRequest request) {
        var authenticationToken = new UsernamePasswordAuthenticationToken(
                normalizarEmail(request.email()),
                request.senha()
        );

        var authentication = authenticationManager.authenticate(authenticationToken);

        Usuario usuario = (Usuario) authentication.getPrincipal();

        if (Boolean.FALSE.equals(usuario.getAtivo())) {
            throw new RuntimeException("Usuário inativo.");
        }

        if (Boolean.FALSE.equals(usuario.getEmailVerificado())) {
            throw new RuntimeException("Valide seu e-mail antes de entrar.");
        }

        String token = jwtService.gerarToken(usuario);

        return toResponse(usuario, token);
    }

    @Transactional
    public void registrarCliente(ClienteRegisterRequest request) {
        String emailNormalizado = normalizarEmail(request.email());

        var usuarioExistente = usuarioRepository.findByEmailIgnoreCase(emailNormalizado);

        if (usuarioExistente.isPresent()) {
            Usuario usuario = usuarioExistente.get();

            if (Boolean.TRUE.equals(usuario.getEmailVerificado())) {
                throw new RuntimeException("Este e-mail já está cadastrado.");
            }

            reenviarCodigoParaUsuario(usuario);
            return;
        }

        Cliente cliente = Cliente.builder()
                .nomeCompleto(request.nomeCompleto())
                .apelido(request.apelido())
                .whatsapp(request.whatsapp())
                .build();

        Cliente clienteSalvo = clienteRepository.save(cliente);

        Usuario usuario = Usuario.builder()
                .nome(request.nomeCompleto())
                .email(emailNormalizado)
                .senha(passwordEncoder.encode(request.senha()))
                .role(UsuarioRole.CLIENTE)
                .cliente(clienteSalvo)
                .ativo(true)
                .emailVerificado(false)
                .build();

        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        reenviarCodigoParaUsuario(usuarioSalvo);
    }

    @Transactional
    public GoogleAuthResponse loginGoogle(GoogleLoginRequest request) {
        GoogleTokenService.GoogleUser googleUser = googleTokenService.validarToken(request.credential());

        String emailNormalizado = normalizarEmail(googleUser.email());

        var usuarioExistente = usuarioRepository.findByEmailIgnoreCase(emailNormalizado);

        if (usuarioExistente.isPresent()) {
            Usuario usuario = usuarioExistente.get();

            if (Boolean.FALSE.equals(usuario.getAtivo())) {
                throw new RuntimeException("Usuário inativo.");
            }

            if (Boolean.FALSE.equals(usuario.getEmailVerificado())) {
                usuario.setEmailVerificado(true);
                usuarioRepository.save(usuario);
            }

            String token = jwtService.gerarToken(usuario);

            return new GoogleAuthResponse(
                    false,
                    usuario.getNome(),
                    usuario.getEmail(),
                    toResponse(usuario, token)
            );
        }

        return new GoogleAuthResponse(
                true,
                googleUser.nome(),
                emailNormalizado,
                null
        );
    }

    @Transactional
    public AuthResponse completarCadastroGoogle(GoogleCompletarCadastroRequest request) {
        GoogleTokenService.GoogleUser googleUser = googleTokenService.validarToken(request.credential());

        String emailNormalizado = normalizarEmail(googleUser.email());

        var usuarioExistente = usuarioRepository.findByEmailIgnoreCase(emailNormalizado);

        if (usuarioExistente.isPresent()) {
            Usuario usuario = usuarioExistente.get();

            if (Boolean.FALSE.equals(usuario.getAtivo())) {
                throw new RuntimeException("Usuário inativo.");
            }

            if (Boolean.FALSE.equals(usuario.getEmailVerificado())) {
                usuario.setEmailVerificado(true);
                usuarioRepository.save(usuario);
            }

            String token = jwtService.gerarToken(usuario);
            return toResponse(usuario, token);
        }

        Cliente cliente = Cliente.builder()
                .nomeCompleto(googleUser.nome())
                .apelido(null)
                .whatsapp(normalizarWhatsapp(request.whatsapp()))
                .build();

        Cliente clienteSalvo = clienteRepository.save(cliente);

        Usuario usuario = Usuario.builder()
                .nome(googleUser.nome())
                .email(emailNormalizado)
                .senha(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(UsuarioRole.CLIENTE)
                .cliente(clienteSalvo)
                .ativo(true)
                .emailVerificado(true)
                .build();

        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        String token = jwtService.gerarToken(usuarioSalvo);

        return toResponse(usuarioSalvo, token);
    }

    private String normalizarWhatsapp(String whatsapp) {
        String apenasNumeros = whatsapp.replaceAll("\\D", "");

        if (apenasNumeros.startsWith("55") && apenasNumeros.length() > 11) {
            apenasNumeros = apenasNumeros.substring(2);
        }

        if (apenasNumeros.length() > 11) {
            apenasNumeros = apenasNumeros.substring(apenasNumeros.length() - 11);
        }

        return apenasNumeros;
    }

    @Transactional
    public AuthResponse validarEmail(ValidarEmailRequest request) {
        String emailNormalizado = normalizarEmail(request.email());

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(emailNormalizado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        if (Boolean.FALSE.equals(usuario.getEmailVerificado())) {
            EmailVerificationCode codigo = emailVerificationCodeRepository
                    .findTopByUsuarioAndCodigoAndUtilizadoFalseOrderByDataCriacaoDesc(
                            usuario,
                            request.codigo()
                    )
                    .orElseThrow(() -> new RuntimeException("Código inválido."));

            if (codigo.expirado()) {
                throw new RuntimeException("Código expirado. Solicite um novo código.");
            }

            codigo.setUtilizado(true);
            usuario.setEmailVerificado(true);

            emailVerificationCodeRepository.save(codigo);
            usuarioRepository.save(usuario);
        }

        String token = jwtService.gerarToken(usuario);

        return toResponse(usuario, token);
    }

    @Transactional
    public void reenviarCodigoEmail(ReenviarCodigoEmailRequest request) {
        String emailNormalizado = normalizarEmail(request.email());

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(emailNormalizado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        if (Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            throw new RuntimeException("Este e-mail já foi verificado.");
        }

        String codigo = gerarCodigoSeisDigitos();

        EmailVerificationCode verificationCode = EmailVerificationCode.builder()
                .usuario(usuario)
                .codigo(codigo)
                .expiraEm(LocalDateTime.now().plusMinutes(10))
                .utilizado(false)
                .build();

        emailVerificationCodeRepository.save(verificationCode);

        emailService.enviarCodigoValidacaoEmail(
                usuario.getEmail(),
                usuario.getNome(),
                codigo
        );
    }

    @Transactional
    public void esqueciSenha(EsqueciSenhaRequest request) {
        String emailNormalizado = normalizarEmail(request.email());

        usuarioRepository.findByEmailIgnoreCase(emailNormalizado)
                .ifPresent(usuario -> {
                    String senhaTemporaria = gerarSenhaTemporaria();

                    usuario.setSenha(passwordEncoder.encode(senhaTemporaria));
                    usuario.setEmailVerificado(true);

                    usuarioRepository.save(usuario);

                    emailService.enviarSenhaTemporaria(
                            usuario.getEmail(),
                            usuario.getNome(),
                            senhaTemporaria
                    );
                });
    }

    @Transactional
    public void alterarSenha(Usuario usuarioLogado, AlterarSenhaRequest request) {
        Usuario usuario = usuarioRepository.findById(usuarioLogado.getId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        boolean senhaAtualCorreta = passwordEncoder.matches(
                request.senhaAtual(),
                usuario.getSenha()
        );

        if (!senhaAtualCorreta) {
            throw new RuntimeException("Senha atual inválida.");
        }

        usuario.setSenha(passwordEncoder.encode(request.novaSenha()));

        usuarioRepository.save(usuario);
    }

    private void validarEmailDisponivel(String email) {
        boolean emailExiste = usuarioRepository.existsByEmailIgnoreCase(email);

        if (emailExiste) {
            throw new RuntimeException("Este e-mail já está cadastrado.");
        }
    }

    private void reenviarCodigoParaUsuario(Usuario usuario) {
        String codigo = gerarCodigoSeisDigitos();

        EmailVerificationCode verificationCode = EmailVerificationCode.builder()
                .usuario(usuario)
                .codigo(codigo)
                .expiraEm(LocalDateTime.now().plusMinutes(10))
                .utilizado(false)
                .build();

        emailVerificationCodeRepository.save(verificationCode);

        emailService.enviarCodigoValidacaoEmail(
                usuario.getEmail(),
                usuario.getNome(),
                codigo
        );
    }

    private String gerarCodigoSeisDigitos() {
        int codigo = secureRandom.nextInt(MAX_CODIGO - MIN_CODIGO + 1) + MIN_CODIGO;
        return String.valueOf(codigo);
    }

    private String gerarSenhaTemporaria() {
        StringBuilder senha = new StringBuilder();

        for (int i = 0; i < 10; i++) {
            int index = secureRandom.nextInt(CARACTERES_SENHA.length());
            senha.append(CARACTERES_SENHA.charAt(index));
        }

        return senha.toString();
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase();
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