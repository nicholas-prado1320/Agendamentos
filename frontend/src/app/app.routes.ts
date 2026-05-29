import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { HomeComponent } from './features/home/home';
import { Login } from './features/login/login';
import { manicureGuard } from './core/guards/manicure.guard';

export const routes: Routes = [

    { path: 'login', component: Login, },

    { path: 'home', component: HomeComponent, canActivate: [authGuard] },

    {
        path: 'clientes',
        loadComponent: () => import('./features/clientes/clientes').then(m => m.Clientes), canActivate: [manicureGuard]
    },
    {
        path: 'novo-cliente',
        loadComponent: () => import('./features/novo-cliente/novo-cliente').then(m => m.NovoCliente), canActivate: [manicureGuard]
    },
    {
        path: 'agendamentos',
        loadComponent: () => import('./features/agendamentos/agendamentos').then(m => m.Agendamentos), canActivate: [authGuard]
    },
    {
        path: 'novo-agendamento',
        loadComponent: () => import('./features/novo-agendamento/novo-agendamento').then(m => m.NovoAgendamento), canActivate: [authGuard]
    },
    {
        path: 'servicos',
        loadComponent: () => import('./features/servicos/servicos').then(m => m.Servicos), canActivate: [manicureGuard]
    },
    {
        path: 'novo-servico',
        loadComponent: () => import('./features/novo-servico/novo-servico').then(m => m.NovoServico), canActivate: [manicureGuard]
    },

    { path: '', pathMatch: 'full', redirectTo: 'home' },
    { path: '**', redirectTo: 'home' },
];
