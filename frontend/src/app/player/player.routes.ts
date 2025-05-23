import { Routes } from "@angular/router";
import { profileResolver } from "../core/resolvers/profile.resolver";

export const playerRoutes: Routes = [
    {
        path: "friends",
        loadComponent: () =>
            import("./friends/friends.component").then((c) => c.FriendsComponent),
        title: "Friends | ShowDAW"
    },
    {
        path: "profile",
        children: [
            {
                path: "",
                loadComponent: () =>
                    import("./profile/profile.component").then((c) => c.ProfileComponent),
                resolve: {
                    profile: profileResolver,
                },
                title: "Profile | ShowDAW"
            },
            {
                path: ":id",
                loadComponent: () =>
                    import("./profile/profile.component").then((c) => c.ProfileComponent),
                resolve: {
                    profile: profileResolver,
                },
                title: "Profile | ShowDAW"
            }
        ]
    }
];
