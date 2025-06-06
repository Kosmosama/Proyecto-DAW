export const SocketEvents = {
  Status: {
    Listen: {
      FriendsOnline: 'friends:online',
      FriendOnline: 'friend:online',
      FriendOffline: 'friend:offline',
    },
  },
  Matchmaking: {
    Listen: {
      MatchFound: 'match:found',
      BattleRequestReceived: 'battle:request:received',
      BattleRequestCancelled: 'battle:request:cancelled',
      BattleRequest: 'battle:request',
      BattleAccept: 'battle:accept',
      BattleCancel: 'battle:cancel',
      Join: 'matchmaking:join',
      Leave: 'matchmaking:leave',
    },
    Emit: {
      MatchFound: 'match:found',
      BattleRequest: 'battle:request',
      BattleCancel: 'battle:cancel',
      BattleAccept: 'battle:accept',
      Join: 'matchmaking:join',
      Leave: 'matchmaking:leave',
    }
  }
} as const;
