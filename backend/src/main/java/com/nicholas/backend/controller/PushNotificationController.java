package com.nicholas.backend.controller;

import com.nicholas.backend.domain.service.PushNotificationService;
import com.nicholas.backend.dto.request.PushSubscriptionRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/push-notifications")
@RequiredArgsConstructor
public class PushNotificationController {

    private final PushNotificationService pushNotificationService;

    @PostMapping("/subscribe")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void subscribe(@RequestBody @Valid PushSubscriptionRequest request) {
        pushNotificationService.salvarInscricao(request);
    }

    @PostMapping("/teste")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void testar() {
        pushNotificationService.enviarTesteParaUsuarioLogado();
    }
}