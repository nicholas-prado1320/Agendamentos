import { computed, Injectable, signal, inject } from '@angular/core';
import { Cliente } from '../models/cliente.model';
import { AgendamentoService } from './agendamento.service';
import { ClienteRequest } from '../models/dtos/cliente.dto';

export type NovoClientePayload = Omit<Cliente, 'id' | 'iniciais'>;
export type EditarClientePayload = Omit<Cliente, 'iniciais'>;

@Injectable({
    providedIn: 'root',
})
export class ClienteService {

    private readonly agendamentoService = inject(AgendamentoService);

    private readonly mockInicial: Cliente[] = [
        {
            id: '1',
            nomeCompleto: 'Maria Eduarda da Silva',
            apelido: 'Duda',
            whatsapp: '(11) 99999-9999',
            iniciais: 'MS',
        },
        {
            id: '2',
            nomeCompleto: 'Ana Clara Santos',
            apelido: 'Aninha',
            whatsapp: '(11) 98888-8888',
            iniciais: 'AS',
        },
        {
            id: '3',
            nomeCompleto: 'Vitória Rodrigues',
            apelido: 'Vick',
            whatsapp: '(11) 97777-7777',
            iniciais: 'VR',
        },
        {
            id: '4',
            nomeCompleto: 'Juliana Martins',
            apelido: 'Jú',
            whatsapp: '(11) 96666-6666',
            iniciais: 'JM',
        },
        {
            id: '5',
            nomeCompleto: 'Larissa Souza',
            apelido: 'Lari',
            whatsapp: '(11) 95555-5555',
            iniciais: 'LS',
        },
        {
            id: '6',
            nomeCompleto: 'Bruna Ferreira',
            apelido: 'Bru',
            whatsapp: '(11) 94444-4444',
            iniciais: 'BF',
        },
    ];

    private readonly clientesState = signal<Cliente[]>(this.mockInicial);

    public readonly clientes = this.clientesState.asReadonly();
    public readonly totalClientes = computed(() => this.clientesState().length);

    listar(): Cliente[] {
        return this.clientesState();
    }

    criar(payload: ClienteRequest): void {
        this.adicionarCliente(payload);
    }

    atualizar(id: string, payload: ClienteRequest): void {
        this.editarCliente({
            id,
            ...payload,
        });
    }

    remover(id: string): void {
        this.removerCliente(id);
    }

    buscarPorId(id: string): Cliente | undefined {
        return this.clientesState().find((cliente) => cliente.id === id);
    }

    buscarPorTexto(texto: string): Cliente[] {
        const termo = texto.trim().toLowerCase();
        if (!termo) {
            return this.clientesState();
        }
        return this.clientesState().filter((cliente) => {
            const nome = cliente.nomeCompleto.toLowerCase();
            const apelido = cliente.apelido?.toLowerCase() ?? '';
            const whatsapp = cliente.whatsapp.toLowerCase();
            return nome.includes(termo) || apelido.includes(termo) || whatsapp.includes(termo);
        });
    }

    adicionarCliente(dados: NovoClientePayload): void {
        const novoCliente: Cliente = {
            ...dados,
            id: crypto.randomUUID(),
            iniciais: this.gerarIniciais(dados.nomeCompleto),
        };
        this.clientesState.update((clientes) => [...clientes, novoCliente]);
    }

    editarCliente(dados: EditarClientePayload): void {
        const clienteAtualizada: Cliente = {
            ...dados,
            iniciais: this.gerarIniciais(dados.nomeCompleto),
        };
        this.clientesState.update((clientes) =>
            clientes.map((cliente) => (cliente.id === dados.id ? clienteAtualizada : cliente))
        );
        this.agendamentoService.atualizarClienteNosAgendamentos({
            id: clienteAtualizada.id,
            nomeCompleto: clienteAtualizada.nomeCompleto,
            apelido: clienteAtualizada.apelido,
            iniciais: clienteAtualizada.iniciais,
        });
    }

    removerCliente(id: string): void {
        this.clientesState.update((clientes) => clientes.filter((cliente) => cliente.id !== id));
    }

    private gerarIniciais(nome: string): string {
        const partes = nome.trim().split(' ').filter(Boolean);
        if (partes.length === 0) {
            return 'XX';
        }
        if (partes.length === 1) {
            return partes[0].slice(0, 2).toUpperCase();
        }
        const primeiraLetra = partes[0][0];
        const ultimaLetra = partes[partes.length - 1][0];
        return `${primeiraLetra}${ultimaLetra}`.toUpperCase();
    }
}