import { Routes } from "@angular/router";
import { ProfileResolver } from "../core/resolvers/profile.resolver";

export const playerRoutes: Routes = [
    {
        path: "friends",
        loadComponent: () => import("./friends/friends.component").then((c) => c.FriendsComponent),
        title: "Friends | ShowDAW"
    },
    {
        path: "profile",
        loadComponent: () => import("./profile/profile.component").then((c) => c.ProfileComponent),
        // resolve: {
        //     profile: ProfileResolver,
        // },
        title: "Profile | ShowDAW"
    }
];