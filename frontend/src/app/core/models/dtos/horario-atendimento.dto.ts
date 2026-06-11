export type DiaSemana = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface HorarioAtendimentoRequest {
    diaSemana: DiaSemana;
    horaInicio: string | null;
    horaFim: string | null;
    ativo: boolean;
    atendimento24h: boolean;
}

export interface HorarioAtendimentoResponse {
    id: number;
    diaSemana: DiaSemana;
    horaInicio: string | null;
    horaFim: string | null;
    ativo: boolean;
    atendimento24h: boolean;
}

export interface HorarioAtendimentoConfiguradoResponse {
    configurado: boolean;
}