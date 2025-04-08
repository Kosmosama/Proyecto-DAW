import { Routes } from "@angular/router";

export const routes: Routes = [
    {   
        path: "auth", 
        loadChildren: () => import("./auth/auth.routes").then(r => r.authRoutes) 
    },
    {   
        path: "player", 
        loadChildren: () => import("./player/player.routes").then(r => r.playerRoutes) 
    },
    { 
        path: '', 
        redirectTo: "/player/friendList", 
        pathMatch: "full" 

    },
    { 
        path: "**", 
        redirectTo: "/auth/login" 
    }
];