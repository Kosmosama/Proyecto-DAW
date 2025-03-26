import { Routes } from "@angular/router";

export const routes: Routes = [
    {
        path: "register",
        loadComponent: () => import("./register/register.component").then((c) => c.RegisterComponent),
        title: "Register | SVtickets"
    },
];