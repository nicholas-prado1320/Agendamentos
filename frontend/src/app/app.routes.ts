import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { HomeComponent } from './features/home/home';

export const routes: Routes = [

    { path: 'home', component: HomeComponent, canActivate: [authGuard] },

    {
        path: 'clientes',
        loadComponent: () => import('./features/clientes/clientes').then(m => m.Clientes)
    },
    {
        path: 'novo-cliente',
        loadComponent: () => import('./features/novo-cliente/novo-cliente').then(m => m.NovoCliente)
    },
    {
        path: 'agendamentos',
        loadComponent: () => import('./features/agendamentos/agendamentos').then(m => m.Agendamentos)
    },
    {
        path: 'novo-agendamento',
        loadComponent: () => import('./features/novo-agendamento/novo-agendamento').then(m => m.NovoAgendamento)
    },
    {
        path: 'servicos',
        loadComponent: () => import('./features/servicos/servicos').then(m => m.Servicos)
    },
    {
        path: 'novo-servico',
        loadComponent: () => import('./features/novo-servico/novo-servico').then(m => m.NovoServico)
    },

    { path: '', pathMatch: 'full', redirectTo: 'home' },
    { path: '**', redirectTo: 'home' },
];
