package com.nicholas.backend.domain.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String remetente;

    public void enviarCodigoValidacaoEmail(String destinatario, String nomeCompleto, String codigo) {
        String assunto = "Código de validação - Peony Beauty";

        String html = """
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2f1b26;">
                    <h2 style="color: #ef8588;">Olá, %s!</h2>

                    <p>
                        Recebemos seu cadastro no <strong>Sistema de Agendamentos Peony Beauty.</strong>
                    </p>

                    <p>Use o código abaixo para validar seu e-mail:</p>

                    <div style="margin: 24px 0; padding: 18px; border: 1px solid #f3c4d8; border-radius: 12px; background: #fff7fb;">
                        <p style="margin: 0 0 8px; font-weight: bold;">Seu código de validação é:</p>
                        <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #ef8588;">%s</p>
                    </div>

                    <p>Esse código expira em 10 minutos.</p>

                    <p style="font-size: 13px; color: #7c3a58;">
                        Se você não solicitou esse cadastro, ignore este e-mail.
                    </p>
                </div>
                """.formatted(escaparHtml(nomeCompleto), codigo);

        enviarHtml(destinatario, assunto, html);
    }

    public void enviarSenhaTemporaria(String destinatario, String nomeCompleto, String senhaTemporaria) {
        String assunto = "Redefinição de senha - Peony Beauty";

        String html = """
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2f1b26;">
                    <h2 style="color: #ef8588;">Olá, %s!</h2>

                    <p>
                        Recebemos uma solicitação para redefinir sua senha de acesso ao
                        <strong>Sistema de Agendamentos Peony Beauty.</strong>
                    </p>

                    <div style="margin: 24px 0; padding: 18px; border: 1px solid #f3c4d8; border-radius: 12px; background: #fff7fb;">
                        <p style="margin: 0 0 8px; font-weight: bold;">Sua nova senha temporária é:</p>
                        <p style="margin: 0; font-size: 22px; font-weight: bold; color: #ef8588;">%s</p>
                    </div>

                    <p>
                        Por segurança, recomendamos que você altere essa senha assim que fizer login no sistema.
                    </p>

                    <p style="font-size: 13px; color: #7c3a58;">
                        Se você não solicitou essa alteração, entre em contato com a Peony Beauty.
                    </p>
                </div>
                """.formatted(escaparHtml(nomeCompleto), escaparHtml(senhaTemporaria));

        enviarHtml(destinatario, assunto, html);
    }

    private void enviarHtml(String destinatario, String assunto, String html) {
        try {
            MimeMessage mensagem = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(mensagem, true, "UTF-8");
            helper.setFrom(remetente);
            helper.setTo(destinatario);
            helper.setSubject(assunto);
            helper.setText(html, true);

            mailSender.send(mensagem);
        } catch (MessagingException exception) {
            throw new RuntimeException("Não foi possível enviar o e-mail.");
        }
    }

    private String escaparHtml(String valor) {
        if (valor == null) {
            return "";
        }

        return valor
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}