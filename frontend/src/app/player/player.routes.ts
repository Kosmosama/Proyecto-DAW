import { Routes } from "@angular/router";

export const playerRoutes: Routes = [
    {
        path: "friendList",
        loadComponent: () => import("./friend-list/friend-list.component").then((c) => c.FriendListComponent),
        title: "Friend List | SVtickets"
    },
];