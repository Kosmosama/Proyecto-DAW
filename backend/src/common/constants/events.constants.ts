export const SocketEvents = {
    Friends: {
        Emit: {
            FriendsOnline: 'friends:online',
            FriendOnline: 'friend:online',
            FriendOffline: 'friend:offline',
        },
    },
    Matchmaking: {
        Listen: {
            Join: 'matchmaking:join',
            Leave: 'matchmaking:leave',
        },
        Emit: {
            MatchFound: 'match:found',
        },
    },
    Battle: {
        Listen: {
            Request: 'battle:request',
            Accept: 'battle:accept',
            Cancel: 'battle:cancel',
        },
        Emit: {
            RequestReceived: 'battle:request:received',
            RequestCancelled: 'battle:request:cancelled',
            RequestExpired: 'battle:request:expired',
        },
    },
    Game: {
        Listen: {
        },
        Emit: {
        },
    },
} as const;

export type SocketEvent = typeof SocketEvents;
