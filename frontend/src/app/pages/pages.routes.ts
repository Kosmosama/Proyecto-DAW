import { Routes } from "@angular/router";

export const pagesRoutes: Routes = [
    {
        path: "home",
        loadComponent: () => import("./home/home.component").then((c) => c.HomeComponent),
        title: "Home | ShowDAW"
    },
];