import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgendamentoRequest, AgendamentoResponse } from '../models/dtos/agendamento.dto';

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

  criar(request: AgendamentoRequest): Observable<AgendamentoResponse> {
    return this.http.post<AgendamentoResponse>(this.apiUrl, request);
  }

  concluir(id: number): Observable<AgendamentoResponse> {
    return this.http.patch<AgendamentoResponse>(`${this.apiUrl}/${id}/concluir`, {});
  }

  cancelar(id: number): Observable<AgendamentoResponse> {
    return this.http.patch<AgendamentoResponse>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}