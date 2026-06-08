package com.nicholas.backend.domain.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class GoogleTokenService {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenService(@Value("${google.oauth.client-id}") String googleClientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        )
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    public GoogleUser validarToken(String credential) {
        try {
            GoogleIdToken idToken = verifier.verify(credential);

            if (idToken == null) {
                throw new RuntimeException("Token do Google inválido.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new RuntimeException("E-mail do Google não verificado.");
            }

            String nome = (String) payload.get("name");
            String email = payload.getEmail();

            return new GoogleUser(nome, email);
        } catch (Exception exception) {
            throw new RuntimeException("Não foi possível validar o login com Google.");
        }
    }

    public record GoogleUser(
            String nome,
            String email
    ) {
    }
}