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
            Action: 'game:match:action',
            Chat: 'game:match:chat',
        },
        Emit: {
            BattleAction: 'game:match:emit:action',
            ChatMessage: 'game:match:emit:chat',
            MatchEnd: 'game:match:end',
            MatchForfeit: 'game:match:forfeit',
            TeamPrivate: 'game:state:teamPrivate',
            TeamPublic: 'game:state:teamPublic',
            Move: 'game:match:move',
            Damage: 'game:match:damage',
            Switch: 'game:match:switch',
            SelectNew: 'game:match:selectNew',
        },
    },
} as const;

export type SocketEvent = typeof SocketEvents;
