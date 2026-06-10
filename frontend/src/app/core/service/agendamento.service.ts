import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgendamentoFiltroParams, AgendamentoRequest, AgendamentoResponse, HorarioDisponivelResponse } from '../models/dtos/agendamento.dto';
import { PageResponse } from '../models/dtos/page-response.dto';

@Injectable({
  providedIn: 'root',
})
export class AgendamentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/agendamentos`;

  listar(): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(this.apiUrl);
  }

  listarHoje(): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/hoje`);
  }

  listarSemana(): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/semana`);
  }

  listarHistorico(): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/historico`);
  }

  listarHorariosDisponiveis(servicoId: number, data: string): Observable<HorarioDisponivelResponse[]> {
    return this.http.get<HorarioDisponivelResponse[]>(`${this.apiUrl}/horarios-disponiveis`, {
      params: { servicoId, data },
    });
  }

  listarPendencias(): Observable<AgendamentoResponse[]> {
    return this.http.get<AgendamentoResponse[]>(`${this.apiUrl}/pendencias`);
  }

  criar(request: AgendamentoRequest): Observable<AgendamentoResponse> {
    return this.http.post<AgendamentoResponse>(this.apiUrl, request);
  }

  iniciar(id: number): Observable<AgendamentoResponse> {
    return this.http.patch<AgendamentoResponse>(`${this.apiUrl}/${id}/iniciar`, {});
  }

  concluir(id: number): Observable<AgendamentoResponse> {
    return this.http.patch<AgendamentoResponse>(`${this.apiUrl}/${id}/concluir`, {});
  }

  naoCompareceu(id: number): Observable<AgendamentoResponse> {
    return this.http.patch<AgendamentoResponse>(`${this.apiUrl}/${id}/nao-compareceu`, {});
  }

  cancelar(id: number): Observable<AgendamentoResponse> {
    return this.http.patch<AgendamentoResponse>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarFiltrado(params: AgendamentoFiltroParams): Observable<PageResponse<AgendamentoResponse>> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('size', params.size);

    if (params.tipo) {
      httpParams = httpParams.set('tipo', params.tipo);
    }

    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    if (params.todosStatus) {
      httpParams = httpParams.set('todosStatus', true);
    }

    if (params.clienteId) {
      httpParams = httpParams.set('clienteId', params.clienteId);
    }

    if (params.servicoId) {
      httpParams = httpParams.set('servicoId', params.servicoId);
    }

    if (params.dataInicio) {
      httpParams = httpParams.set('dataInicio', params.dataInicio);
    }

    if (params.dataFim) {
      httpParams = httpParams.set('dataFim', params.dataFim);
    }

    if (params.valorMinimo !== undefined && params.valorMinimo !== null) {
      httpParams = httpParams.set('valorMinimo', params.valorMinimo);
    }

    if (params.valorMaximo !== undefined && params.valorMaximo !== null) {
      httpParams = httpParams.set('valorMaximo', params.valorMaximo);
    }

    if (params.busca?.trim()) {
      httpParams = httpParams.set('busca', params.busca.trim());
    }

    return this.http.get<PageResponse<AgendamentoResponse>>(`${this.apiUrl}/filtro`, {
      params: httpParams,
    });
  }
}