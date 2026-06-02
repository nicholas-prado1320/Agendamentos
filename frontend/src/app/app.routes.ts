import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { manicureGuard } from './core/guards/manicure.guard';
import { horarioConfiguradoGuard } from './core/guards/horario-configurado.guard';
import { HomeComponent } from './features/home/home';
import { Login } from './features/login/login';

export const routes: Routes = [

    { path: 'login', component: Login, },

    { path: 'home', component: HomeComponent, canActivate: [authGuard, horarioConfiguradoGuard] },

    {
        path: 'clientes',
        loadComponent: () => import('./features/clientes/clientes').then(m => m.Clientes), canActivate: [manicureGuard, horarioConfiguradoGuard]
    },
    {
        path: 'novo-cliente',
        loadComponent: () => import('./features/novo-cliente/novo-cliente').then(m => m.NovoCliente), canActivate: [manicureGuard, horarioConfiguradoGuard]
    },
    {
        path: 'agendamentos',
        loadComponent: () => import('./features/agendamentos/agendamentos').then(m => m.Agendamentos), canActivate: [authGuard, horarioConfiguradoGuard]
    },
    {
        path: 'novo-agendamento',
        loadComponent: () => import('./features/novo-agendamento/novo-agendamento').then(m => m.NovoAgendamento), canActivate: [authGuard, horarioConfiguradoGuard]
    },
    {
        path: 'servicos',
        loadComponent: () => import('./features/servicos/servicos').then(m => m.Servicos), canActivate: [manicureGuard, horarioConfiguradoGuard]
    },
    {
        path: 'novo-servico',
        loadComponent: () => import('./features/novo-servico/novo-servico').then(m => m.NovoServico), canActivate: [manicureGuard, horarioConfiguradoGuard]
    },
    {
        path: 'horarios',
        loadComponent: () => import('./features/horarios/horarios').then(m => m.Horarios), canActivate: [manicureGuard]
    },

    { path: '', pathMatch: 'full', redirectTo: 'home' },
    { path: '**', redirectTo: 'home' },
];
