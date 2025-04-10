import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';

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
                path: 'player',
                loadChildren: () =>
                    import('./player/player.routes').then((r) => r.playerRoutes),
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
