package com.nicholas.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.DayOfWeek;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "horarios_atendimento")
public class HorarioAtendimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DayOfWeek diaSemana;

    @Column
    private LocalTime horaInicio;

    @Column
    private LocalTime horaFim;

    @Column(nullable = false)
    private Boolean ativo;

    @Column(name = "atendimento_24h", nullable = false)
    private Boolean atendimento24h;
}