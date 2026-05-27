import { Injectable, signal } from '@angular/core';
import { Agendamento } from '../models/agendamento.model';

export type NovoAgendamentoPayload = Omit<Agendamento, 'id' | 'status'>;

@Injectable({
    providedIn: 'root',
})
export class AgendamentoService {
    private readonly agendamentosState = signal<Agendamento[]>([
        {
            id: 'mock-1',
            cliente: {
                id: '1',
                nomeCompleto: 'Maria Eduarda da Silva',
                apelido: 'Duda',
                iniciais: 'MA',
            },
            servico: {
                id: '3',
                nome: 'Esmaltação em gel',
                preco: 80,
            },
            data: new Date().toISOString().split('T')[0],
            hora: '09:00',
            status: 'Agendado',
        },
    ]);

    public readonly agendamentos = this.agendamentosState.asReadonly();

    adicionarAgendamento(dados: NovoAgendamentoPayload): void {
        const novoAgendamento: Agendamento = {
            ...dados,
            id: crypto.randomUUID(),
            status: 'Agendado',
        };
        this.agendamentosState.update((lista) => [...lista, novoAgendamento]);
    }

    concluirAgendamento(id: string): void {
        this.agendamentosState.update((lista) =>
            lista.map((agendamento) => agendamento.id === id ? { ...agendamento, status: 'Concluído', } : agendamento
            )
        );
    }

    cancelarAgendamento(id: string): void {
        this.agendamentosState.update((lista) =>
            lista.map((agendamento) => agendamento.id === id ? { ...agendamento, status: 'Cancelado', } : agendamento));
    }

    removerAgendamento(id: string): void {
        this.agendamentosState.update((lista) => lista.filter((agendamento) => agendamento.id !== id));
    }
}