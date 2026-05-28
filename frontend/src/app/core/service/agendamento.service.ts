import { Injectable, signal } from '@angular/core';
import { Agendamento, ClienteAgendamento, ServicoAgendamento } from '../models/agendamento.model';
import { AgendamentoRequest } from '../models/dtos/agendamento.dto';

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

    listar(): Agendamento[] {
        return this.agendamentosState();
    }

    remover(id: string): void {
        this.removerAgendamento(id);
    }

    concluir(id: string): void {
        this.concluirAgendamento(id);
    }

    cancelar(id: string): void {
        this.cancelarAgendamento(id);
    }

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

    existeAgendamentoNoHorario(data: string, hora: string): boolean {
        return this.agendamentosState().some((agendamento) => {
            const mesmoDia = agendamento.data === data;
            const mesmaHora = agendamento.hora === hora;
            const estaAtivo = agendamento.status === 'Agendado';
            return mesmoDia && mesmaHora && estaAtivo;
        });
    }

    atualizarClienteNosAgendamentos(clienteAtualizada: ClienteAgendamento): void {
        this.agendamentosState.update((agendamentos) =>
            agendamentos.map((agendamento) =>
                agendamento.cliente.id === clienteAtualizada.id
                    ? {
                        ...agendamento,
                        cliente: {
                            ...agendamento.cliente,
                            nomeCompleto: clienteAtualizada.nomeCompleto,
                            apelido: clienteAtualizada.apelido,
                            iniciais: clienteAtualizada.iniciais,
                        },
                    } : agendamento
            )
        );
    }

    atualizarServicoNosAgendamentos(servicoAtualizado: ServicoAgendamento): void {
        this.agendamentosState.update((agendamentos) =>
            agendamentos.map((agendamento) =>
                agendamento.servico.id === servicoAtualizado.id
                    ? {
                        ...agendamento,
                        servico: {
                            ...agendamento.servico,
                            nome: servicoAtualizado.nome,
                            preco: servicoAtualizado.preco,
                        },
                    }
                    : agendamento
            )
        );
    }
}