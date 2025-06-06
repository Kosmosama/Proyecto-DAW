import { Routes } from "@angular/router";

export const pagesRoutes: Routes = [
    {
        path: "home",
        loadComponent: () => import("./home/home.component").then((c) => c.HomeComponent),
        title: "Home | ShowDAW"
    },
    {
        path: "team-builder",
        loadComponent: () => import("./team-builder/team-builder.component").then((c) => c.TeamBuilderComponent),
        title: "Team Builder | ShowDAW"
    },
    {
        path: "team-builder/builder",
        loadComponent: () => import("./team-builder/build-tool/build-tool.component").then((c) => c.BuildToolComponent),
        title: "Team Builder | ShowDAW"
    },
];