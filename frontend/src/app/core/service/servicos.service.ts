import { Injectable, signal } from '@angular/core';
import { Servico } from '../models/servicos.model';

@Injectable({
  providedIn: 'root'
})
export class ServicoService {
  private servicosState = signal<Servico[]>([
    { id: '1', nome: 'Manicure tradicional', descricao: 'Cutilagem e esmaltação simples.', duracao: '1h' },
    { id: '2', nome: 'Pedicure tradicional', descricao: 'Cutilagem, esmaltação e hidratação.', duracao: '1h' },
    { id: '3', nome: 'Esmaltação em gel', descricao: 'Esmaltação de alta durabilidade com secagem em cabine UV.', duracao: '1h 30min' },
    { id: '4', nome: 'Manicure + Alongamento', descricao: 'Alongamento em fibra de vidro ou gel.', duracao: '2h 30min' }
  ]);

  public readonly servicos = this.servicosState.asReadonly();

  adicionarServico(dados: Omit<Servico, 'id'>): void {
    const novoServico: Servico = {
      ...dados,
      id: crypto.randomUUID()
    };
    this.servicosState.update(lista => [...lista, novoServico]);
  }
}