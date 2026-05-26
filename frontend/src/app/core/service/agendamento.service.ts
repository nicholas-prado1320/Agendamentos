import { Injectable, signal } from '@angular/core';
import { Agendamento } from '../models/agendamento.model';

@Injectable({
    providedIn: 'root'
})
export class AgendamentoService {

    private agendamentosState = signal<Agendamento[]>([
        {
            id: 'mock-1',
            clienteId: '1',
            data: new Date().toISOString().split('T')[0],
            hora: '09:00',
            servico: 'Esmaltação em gel',
            status: 'Agendado'
        }
    ]);

    readonly agendamentos = this.agendamentosState.asReadonly();

    adicionarAgendamento(dados: Omit<Agendamento, 'id' | 'status'>): void {
        const novoAgendamento: Agendamento = {
            ...dados,
            id: crypto.randomUUID(),
            status: 'Agendado'
        };
        this.agendamentosState.update(lista => [...lista, novoAgendamento]);
    }
}