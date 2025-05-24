import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { loginActivateGuard } from './core/guards/login-activate.guard';

export const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () =>
            import('./auth/auth.routes').then((r) => r.authRoutes),
    },
    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: 'pages',
                loadChildren: () =>
                    import('./pages/pages.routes').then((r) => r.pagesRoutes),
                // canActivate: [loginActivateGuard]
            },
            {
                path: 'player',
                loadChildren: () =>
                    import('./player/player.routes').then((r) => r.playerRoutes),
                // canActivate: [loginActivateGuard]
            },
            {
                path: '',
                redirectTo: '/auth/login',
                pathMatch: 'full',
            },
            {
                path: '**',
                redirectTo: '/auth/login',
            },
        ],
    },
];
