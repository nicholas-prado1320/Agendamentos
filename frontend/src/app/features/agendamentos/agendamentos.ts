import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AgendamentoService } from '../../core/service/agendamento.service';
import { ClienteService } from '../../core/service/cliente.service';

@Component({
  selector: 'app-agendamentos',
  imports: [RouterModule],
  templateUrl: './agendamentos.html',
  styleUrl: './agendamentos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Agendamentos {
  private agendamentoService = inject(AgendamentoService);
  private clienteService = inject(ClienteService);

  todosAgendamentos = computed(() => {
    const agendamentos = this.agendamentoService.agendamentos();
    const clientes = this.clienteService.clientes();
    return agendamentos.map(agendamento => {
      const cliente = clientes.find(c => c.id === agendamento.clienteId);
      return {
        ...agendamento,
        clienteNome: cliente?.nomeCompleto || 'Cliente excluída',
        iniciais: cliente?.iniciais || '--'
      };
    }).sort((a, b) => {
      const dataHoraA = new Date(`${a.data}T${a.hora}`).getTime();
      const dataHoraB = new Date(`${b.data}T${b.hora}`).getTime();
      return dataHoraA - dataHoraB;
    });
  });

  formatarData(dataIso: string): string {
    if (!dataIso) return '';
    const partes = dataIso.split('-');
    if (partes.length !== 3) return dataIso;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
}