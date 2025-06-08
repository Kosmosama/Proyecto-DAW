export const SocketEvents = {
  Friends: {
    Listen: {
      FriendsOnline: 'friends:online',
      FriendOnline: 'friend:online',
      FriendOffline: 'friend:offline',
    }
  },
  GeneralChat: {
    Emit: {
      MessageUnique: 'general:message:unique',
    },
    Listen: {
      MessageBroadcast: 'general:message:broadcast',
    }
  },
  Matchmaking: {
    Emit: {
      Join: 'matchmaking:join',
      Leave: 'matchmaking:leave',
    },
    Listen: {
      MatchFound: 'match:found',
    }
  },
  Battle: {
    Emit: {
      Request: 'battle:request',
      Accept: 'battle:accept',
      Cancel: 'battle:cancel',
    },
    Listen: {
      RequestReceived: 'battle:request:received',
      RequestCancelled: 'battle:request:cancelled',
      RequestExpired: 'battle:request:expired',
    }
  },
  Game: {
    Emit: {
      Action: 'game:match:action',
      Chat: 'game:match:chat',
    },
    Listen: {
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
    }
  }
} as const;
