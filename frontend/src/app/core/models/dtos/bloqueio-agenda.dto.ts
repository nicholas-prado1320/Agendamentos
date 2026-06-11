export interface BloqueioAgendaRequest {
    dataInicio: string;
    dataFim: string | null;
    horaInicio: string | null;
    horaFim: string | null;
    diaInteiro: boolean;
    motivo: string;
}

export interface BloqueioAgendaResponse {
    id: number;
    dataInicio: string;
    dataFim: string;
    horaInicio: string | null;
    horaFim: string | null;
    diaInteiro: boolean;
    motivo: string;
    ativo: boolean;
}