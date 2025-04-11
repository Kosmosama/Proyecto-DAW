import { Routes } from "@angular/router";

export const authRoutes: Routes = [
    {
        path: "register",
        loadComponent: () => import("./register/register.component").then((c) => c.RegisterComponent),
        title: "Register | ShowDAW"
    },
    {
        path: "login",
        loadComponent: () => import("./login/login.component").then((c) => c.LoginComponent),
        title: "Login | ShowDAW"
    },
    {
        path: "oauth-callback",
        loadComponent: () => import("./oauth-callback/oauth-callback.component").then((c) => c.OAuthCallbackComponent),
    },
];