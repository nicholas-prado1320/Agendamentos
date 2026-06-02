import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../service/auth.service';
import { HorarioAtendimentoService } from '../service/horario-atendimento.service';

export const horarioConfiguradoGuard: CanActivateFn = () => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const horarioAtendimentoService = inject(HorarioAtendimentoService);

    if (authService.isCliente()) {
        return true;
}

    if (!authService.isManicure()) {
        return router.createUrlTree(['/login']);
    }

    return horarioAtendimentoService.verificarConfiguracao().pipe(
        map((response) => {
            if (response.configurado) {
                return true;
            }

            return router.createUrlTree(['/horarios']);
        }),
        catchError(() => {
            return of(router.createUrlTree(['/horarios']));
        })
    );
};