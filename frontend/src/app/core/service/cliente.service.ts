import { computed, Injectable, signal } from '@angular/core';
import { Cliente } from '../models/cliente.model';

export type NovoClientePayload = Omit<Cliente, 'id' | 'iniciais'>;
export type EditarClientePayload = Omit<Cliente, 'iniciais'>;

@Injectable({
    providedIn: 'root',
})
export class ClienteService {

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
        this.clientesState.update((clientes) =>
            clientes.map((cliente) => cliente.id === dados.id ? { ...dados, iniciais: this.gerarIniciais(dados.nomeCompleto), } : cliente
            )
        );
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