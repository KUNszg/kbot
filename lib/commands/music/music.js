const _ = require('lodash');
const requireDir = require('require-dir');

const formatToMMSS = ms => {
  const minutes = _.padStart(Math.floor(ms / 60000).toString(), 2, '0');
  const seconds = _.padStart(Math.floor((ms % 60000) / 1000).toString(), 2, '0');
  return `${minutes}:${seconds}`;
};

const subCommands = requireDir('./subCommands', { recurse: true, resolve: 'sync' });

const music = async (context, { kb, Commons }) => {
  const userInputParts = _.split(_.get(context, 'standarizedMessageParts.userInput'), ' ');
  const subCommand = _.get(subCommands, _.first(userInputParts));

  if (!!_.get(subCommand, 'invocation')) {
    const userInputPartsWithNoSubCommand = _.tail(userInputParts);

    context.userInputPartsWithNoSubCommand = userInputPartsWithNoSubCommand;
    context.referencedUsername = Commons.UtilityRepository().findUsernameInUserInputParts(
      userInputPartsWithNoSubCommand
    );

    return await subCommand.invocation(context, { kb, Commons });
  }

  const _username = Commons.UtilityRepository().findUsernameInUserInputParts(userInputParts);

  const getUser = await Commons.UserRepository(kb).getUser({ username: _username });

  const userId = _.get(getUser, 'userId') || _.get(context, 'userstate.user-id');

  if (_.isEmpty(userId)) {
    return {
      response: 'user was not found.'
    };
  }

  const isUserOptedOut = await Commons.UserRepository(kb).isUserOptedOut('music', {
    userId
  });

  if (isUserOptedOut && _.get(context, 'userstate.user-id') !== userId) {
    return {
      response: 'that user has opted out from being a target of this command.'
    };
  }

  let currentlyPlaying = null;

  try {
    currentlyPlaying = await Commons.UserRepository(kb).spotifyFetchWithOauth(
      'GET',
      '/v1/me/player/currently-playing',
      userId,
      _username !== _.get(context, 'userstate.username')
    );

    currentlyPlaying = _.get(currentlyPlaying, 'endpointResponse');
  } catch (error) {
    if (error.message === 'Spotify Oauth token not found') {
      return {
        response: `${_username ? 'this user is not' : 'you are not'} registered for this command - use 'kb register music'.`
      };
    }

    if (error.message === 'Spotify Oauth token could not be refreshed') {
      return {
        response:
          'there was a problem related to fetching Spotify token while processing this request.'
      };
    }

    if (error.message === 'Spotify lookup not allowed') {
      return {
        response:
          "this user's settings do not allow for a song lookup, they can enable it by using 'kb spotify allow'."
      };
    }
  }

  if (_.isEmpty(currentlyPlaying)) {
    return {
      response: `no song is currently playing on ${_username ? `${_username}'s` : 'your'} Spotify.`
    };
  }

  const [artistName, songTitle] = Commons.UtilityRepository().limitInputLength([
    _.get(currentlyPlaying, 'item.artists.0.name'),
    _.get(currentlyPlaying, 'item.name')
  ]);

  const progressHumanized = formatToMMSS(_.get(currentlyPlaying, 'progress_ms', 0));
  const durationHumanized = formatToMMSS(_.get(currentlyPlaying, 'item.duration_ms', 0));

  return {
    response: `current song playing on ${_username ? `${_username}'s` : 'your'} Spotify: 
    ${songTitle} by ${artistName}, ${_.get(currentlyPlaying, 'is_playing') ? '▶ ' : '⏸ '}
    [${progressHumanized}/${durationHumanized}]`
  };
};

module.exports.invocation = music;
