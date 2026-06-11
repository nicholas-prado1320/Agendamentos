package com.nicholas.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bloqueios_agenda")
public class BloqueioAgenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate dataInicio;

    @Column(nullable = false)
    private LocalDate dataFim;

    @Column
    private LocalTime horaInicio;

    @Column
    private LocalTime horaFim;

    @Column(nullable = false)
    private Boolean diaInteiro;

    @Column(nullable = false, length = 120)
    private String motivo;

    @Column(nullable = false)
    private Boolean ativo;

    @Column(nullable = false)
    private LocalDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        if (ativo == null) {
            ativo = true;
        }

        if (diaInteiro == null) {
            diaInteiro = false;
        }

        if (dataCriacao == null) {
            dataCriacao = LocalDateTime.now();
        }
    }
}