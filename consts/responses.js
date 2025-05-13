module.exports = {
  COMMON: {
    ERRORS: {
      USER_NOT_FOUND: 'user was not found.',
      OPTED_OUT: 'that user has opted out from being a target of this command.',
      NOT_REGISTERED: username =>
        `${
          username ? 'this user is not' : 'you are not'
        } registered for this command - for details see ' kb register '.`
    }
  },

  MUSIC: {
    ERRORS: {
      NO_SONG_PROVIDED: action => `please provide a song to ${action}.`,
      NO_ACTIVE_DEVICE:
        'command failed: you need to have your spotify player playing to use this command.',
      NO_PREMIUM: 'you need to be subscribed to Spotify premium to use this command.',
      NO_TRACKS_FOUND: 'no tracks were found with given query.',
      TOKEN_REFRESH_FAILED:
        'there was a problem related to fetching Spotify token while processing this request.',
      LOOKUP_NOT_ALLOWED:
        "this user's settings do not allow for a song lookup, they can enable it by using 'kb spotify allow'.",
      NO_SONG_PLAYING: username =>
        `no song is currently playing on ${username ? `${username}'s` : 'your'} Spotify.`
    },
    SUCCESS: {
      NOW_PLAYING: (songTitle, artistName) =>
        `now playing: ${songTitle} by ${artistName} on your Spotify.`,
      QUEUED: (songTitle, artistName) =>
        `queued ${songTitle} by ${artistName} on your Spotify.`,
      CURRENT_SONG: (username, songTitle, artistName, isPlaying, progress, duration) =>
        `current song playing on ${
          username ? `${username}'s` : 'your'
        } Spotify: ${songTitle} by ${artistName}, ${
          isPlaying ? '▶ ' : '⏸ '
        } [${progress}/${duration}]`,
      ALLOW: 'you have successfully enabled song lookup for this user.',
      DISALLOW: 'you have successfully disabled song lookup for this user.'
    }
  },

  NAMECHANGE: {
    ERRORS: {
      USERNAME_NOT_FOUND: 'username was not found.',
      NO_NAME_CHANGES: 'no name changes were found.'
    },
    SUCCESS: {
      NAME_CHANGES: (count, usernames) => `name changes detected (${count}): ${usernames}`
    }
  },

  PING: {
    SUCCESS: {
      PONG: uptimeFormatted =>
        `pong! Running for ${uptimeFormatted}, project website: https://kunszg.com`
    }
  },

  WEBSITE: {
    SUCCESS: {
      URL: 'https://kunszg.com/'
    }
  },

  COMMANDS: {
    SUCCESS: {
      LIST: 'you can find current active commands at https://kunszg.com/commands'
    }
  },

  REGISTER: {
    SUCCESS: {
      REGISTER_LINK: `You can connect your apps with KsyncBot at https://kunszg.com/commands/register`
    }
  }
};
