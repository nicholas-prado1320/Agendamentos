import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

export const manicureGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.token) {
        return router.createUrlTree(['/login']);
    }

    if (authService.isManicure()) {
        return true;
    }

    return router.createUrlTree(['/home']);
};