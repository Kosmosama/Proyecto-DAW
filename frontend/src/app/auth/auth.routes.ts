import { Routes } from "@angular/router";

export const routes: Routes = [
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
];