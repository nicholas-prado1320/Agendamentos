import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BloqueioAgendaRequest, BloqueioAgendaResponse } from '../models/dtos/bloqueio-agenda.dto';

@Injectable({
    providedIn: 'root',
})
export class BloqueioAgendaService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/bloqueios-agenda`;

    listar(): Observable<BloqueioAgendaResponse[]> {
        return this.http.get<BloqueioAgendaResponse[]>(this.apiUrl);
    }

    criar(request: BloqueioAgendaRequest): Observable<BloqueioAgendaResponse> {
        return this.http.post<BloqueioAgendaResponse>(this.apiUrl, request);
    }

    excluir(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}