import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
// import { AuthService } from '../services/auth.service';
// import { DialogService } from '../services/dialog.service';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
    // const authService = inject(AuthService);
    const router = inject(Router);
    // const dialogService = inject(DialogService);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
        return true;
    }

    // const currentUser = authService.getUser();
    // if (!currentUser) {
    //     router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    //     return false;
    // }
    return true;
};