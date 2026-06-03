package com.nicholas.backend.domain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nicholas.backend.domain.entity.PushSubscription;
import com.nicholas.backend.domain.entity.Usuario;
import com.nicholas.backend.domain.repository.PushSubscriptionRepository;
import com.nicholas.backend.dto.request.PushSubscriptionRequest;
import lombok.RequiredArgsConstructor;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.jose4j.lang.JoseException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;
    private final ObjectMapper objectMapper;

    @Value("${push.vapid.public-key}")
    private String publicKey;

    @Value("${push.vapid.private-key}")
    private String privateKey;

    @Value("${push.vapid.subject}")
    private String subject;

    @Transactional
    public void salvarInscricao(PushSubscriptionRequest request) {
        Usuario usuario = usuarioAutenticadoService.getUsuario();

        PushSubscription subscription = pushSubscriptionRepository
                .findByEndpoint(request.endpoint())
                .orElseGet(PushSubscription::new);

        subscription.setUsuario(usuario);
        subscription.setEndpoint(request.endpoint());
        subscription.setP256dh(request.keys().p256dh());
        subscription.setAuth(request.keys().auth());
        subscription.setAtivo(true);

        pushSubscriptionRepository.save(subscription);
    }

    public void enviarTesteParaUsuarioLogado() {
        Usuario usuario = usuarioAutenticadoService.getUsuario();

        enviarParaUsuario(
                usuario,
                "Notificações ativadas",
                "Você receberá lembretes dos seus agendamentos por aqui.",
                "/home"
        );
    }

    public void enviarParaUsuario(Usuario usuario, String titulo, String mensagem, String url) {
        List<PushSubscription> subscriptions = pushSubscriptionRepository
                .findByUsuarioIdAndAtivoTrue(usuario.getId());

        for (PushSubscription subscription : subscriptions) {
            try {
                enviar(subscription, titulo, mensagem, url);
            } catch (Exception exception) {
                subscription.setAtivo(false);
                pushSubscriptionRepository.save(subscription);
            }
        }
    }

    private void enviar(
            PushSubscription subscription,
            String titulo,
            String mensagem,
            String url
    ) throws GeneralSecurityException, IOException, JoseException, ExecutionException, InterruptedException {
        PushService pushService = new PushService(publicKey, privateKey, subject);

        String payload = objectMapper.writeValueAsString(
                Map.of(
                        "title", titulo,
                        "body", mensagem,
                        "url", url
                )
        );

        Notification notification = new Notification(
                subscription.getEndpoint(),
                subscription.getP256dh(),
                subscription.getAuth(),
                payload
        );

        pushService.send(notification);
    }
}