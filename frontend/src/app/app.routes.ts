import { Routes } from "@angular/router";

export const routes: Routes = [
    { 
        path: "", 
        redirectTo: "/auth/register", 
        pathMatch: "full" 

    },
    {   
        path: "auth", 
        loadChildren: () => import("./auth/auth.routes").then(r => r.routes) 
    },
    { 
        path: "**", 
        redirectTo: "error" }
];