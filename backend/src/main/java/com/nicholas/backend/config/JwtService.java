package com.nicholas.backend.config;

import com.nicholas.backend.domain.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key;
    private final String issuer;
    private final Long expirationHours;

    public JwtService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.issuer}") String issuer,
            @Value("${security.jwt.expiration-hours}") Long expirationHours
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.expirationHours = expirationHours;
    }

    public String gerarToken(Usuario usuario) {
        Instant now = Instant.now();
        Instant expiration = now.plusSeconds(expirationHours * 60 * 60);

        return Jwts.builder()
                .subject(usuario.getEmail())
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .claims(Map.of(
                        "id", usuario.getId(),
                        "nome", usuario.getNome(),
                        "role", usuario.getRole().name()
                ))
                .signWith(key)
                .compact();
    }

    public String validarTokenEObterEmail(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }
}