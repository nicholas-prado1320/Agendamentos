import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServicoRequest, ServicoResponse } from '../models/dtos/servico.dto';

@Injectable({
  providedIn: 'root',
})
export class ServicoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/servicos`;

  listar(): Observable<ServicoResponse[]> {
    return this.http.get<ServicoResponse[]>(this.apiUrl);
  }

  listarAtivos(): Observable<ServicoResponse[]> {
    return this.http.get<ServicoResponse[]>(`${this.apiUrl}/ativos`);
  }

  buscarPorId(id: number): Observable<ServicoResponse> {
    return this.http.get<ServicoResponse>(`${this.apiUrl}/${id}`);
  }

  criar(request: ServicoRequest): Observable<ServicoResponse> {
    return this.http.post<ServicoResponse>(this.apiUrl, request);
  }

  atualizar(id: number, request: ServicoRequest): Observable<ServicoResponse> {
    return this.http.put<ServicoResponse>(`${this.apiUrl}/${id}`, request);
  }

  ativar(id: number): Observable<ServicoResponse> {
    return this.http.patch<ServicoResponse>(`${this.apiUrl}/${id}/ativar`, {});
  }

  inativar(id: number): Observable<ServicoResponse> {
    return this.http.patch<ServicoResponse>(`${this.apiUrl}/${id}/inativar`, {});
  }
}