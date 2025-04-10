import { Routes } from "@angular/router";

export const playerRoutes: Routes = [
    {
        path: "friendList",
        loadComponent: () => import("../shared/components/friend-list/friend-list.component").then((c) => c.FriendListComponent),
        title: "Friend List | ShowDAW"
    },
    {
        path: "friends",
        loadComponent: () => import("./friends/friends.component").then((c) => c.FriendsComponent),
        title: "Friends | ShowDAW"
    },
    {
        path: "friendSearch",
        loadComponent: () => import("../shared/components/friend-search/friend-search.component").then((c) => c.FriendSearchComponent),
        title: "Friends | ShowDAW"
    },
];