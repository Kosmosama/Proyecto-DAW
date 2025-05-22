import { Routes } from "@angular/router";
import { leavePageGuard } from "../core/guards/leave-page.guard";

export const authRoutes: Routes = [
    {
        path: "register",
        loadComponent: () => import("./register/register.component").then((c) => c.RegisterComponent),
        title: "Register | ShowDAW",
        canDeactivate: [leavePageGuard]
    },
    {
        path: "login",
        loadComponent: () => import("./login/login.component").then((c) => c.LoginComponent),
        title: "Login | ShowDAW",
        canDeactivate: [leavePageGuard]
    },
    {
        path: "oauth-callback",
        loadComponent: () => import("./oauth-callback/oauth-callback.component").then((c) => c.OAuthCallbackComponent),
    },
];