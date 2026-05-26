import { Injectable, signal, computed } from '@angular/core';
import { Cliente } from '../models/cliente.model';

@Injectable({
    providedIn: 'root'
})
export class ClienteService {

    private readonly mockInicial: Cliente[] = [
        { id: '1', nomeCompleto: 'Maria Eduarda da Silva', apelido: 'Duda', whatsapp: '(11) 99999-9999', iniciais: 'MA' },
        { id: '2', nomeCompleto: 'Ana Clara Santos', apelido: 'Aninha', whatsapp: '(11) 98888-8888', iniciais: 'AC' },
        { id: '3', nomeCompleto: 'Vitória Rodrigues', apelido: 'Vick', whatsapp: '(11) 97777-7777', iniciais: 'VT' },
        { id: '4', nomeCompleto: 'Juliana Martins', apelido: 'Jú', whatsapp: '(11) 96666-6666', iniciais: 'JM' },
        { id: '5', nomeCompleto: 'Larissa Souza', apelido: 'Lari', whatsapp: '(11) 95555-5555', iniciais: 'LS' },
        { id: '6', nomeCompleto: 'Bruna Ferreira', apelido: 'Bru', whatsapp: '(11) 94444-4444', iniciais: 'BF' },
    ];

    private clientesState = signal<Cliente[]>(this.mockInicial);

    public readonly clientes = this.clientesState.asReadonly();
    public readonly totalClientes = computed(() => this.clientesState().length);

    adicionarCliente(dados: Omit<Cliente, 'id' | 'iniciais'>): void {
        const novoCliente: Cliente = {
            ...dados,
            id: crypto.randomUUID(),
            iniciais: this.gerarIniciais(dados.nomeCompleto)
        };
        this.clientesState.update(clientes => [...clientes, novoCliente]);
    }

    private gerarIniciais(nome: string): string {
        const partes = nome.trim().split(' ').filter(p => p.length > 0);
        if (partes.length === 0) return 'XX';
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        const primeiraLetra = partes[0][0];
        const ultimaLetra = partes[partes.length - 1][0];
        return (primeiraLetra + ultimaLetra).toUpperCase();
    }
}