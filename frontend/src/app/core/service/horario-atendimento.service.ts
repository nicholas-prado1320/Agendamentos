import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HorarioAtendimentoConfiguradoResponse, HorarioAtendimentoRequest, HorarioAtendimentoResponse } from '../models/dtos/horario-atendimento.dto';

@Injectable({
    providedIn: 'root',
})
export class HorarioAtendimentoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/horarios-atendimento`;

    listar(): Observable<HorarioAtendimentoResponse[]> {
        return this.http.get<HorarioAtendimentoResponse[]>(this.apiUrl);
    }

    verificarConfiguracao(): Observable<HorarioAtendimentoConfiguradoResponse> {
        return this.http.get<HorarioAtendimentoConfiguradoResponse>(`${this.apiUrl}/configurado`);
    }

    salvarTodos(request: HorarioAtendimentoRequest[]): Observable<HorarioAtendimentoResponse[]> {
        return this.http.put<HorarioAtendimentoResponse[]>(this.apiUrl, request);
    }
}