const _ = require('lodash');
const requireDir = require('require-dir');

const validateUser = require('./utils/userValidator');
const handleSpotifyError = require('./utils/spotifyErrorResponses');

const formatToMMSS = ms => {
  const minutes = _.padStart(Math.floor(ms / 60000).toString(), 2, '0');
  const seconds = _.padStart(Math.floor((ms % 60000) / 1000).toString(), 2, '0');
  return `${minutes}:${seconds}`;
};

const subCommands = requireDir('./subCommands', { recurse: true, resolve: 'sync' });

const music = async (context, { kb, Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();
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

  const userValidation = await validateUser(context, { Commons }, _username);
  if (userValidation.error) {
    return userValidation.response;
  }

  const { userId, username } = userValidation;

  try {
    const currentlyPlaying = await Commons.UserRepository().spotifyFetchWithOauth(
      'GET',
      '/v1/me/player/currently-playing',
      {
        userId,
        isSender: username !== _.get(context, 'userstate.username')
      }
    );

    const trackData = _.get(currentlyPlaying, 'endpointResponse');

    if (_.isEmpty(trackData)) {
      return {
        response: responses.MUSIC.ERRORS.NO_SONG_PLAYING(username)
      };
    }

    const [artistName, songTitle] = Commons.UtilityRepository().limitInputLength([
      _.get(trackData, 'item.artists.0.name'),
      _.get(trackData, 'item.name')
    ]);

    const progressHumanized = formatToMMSS(_.get(trackData, 'progress_ms', 0));
    const durationHumanized = formatToMMSS(_.get(trackData, 'item.duration_ms', 0));

    return {
      response: responses.MUSIC.SUCCESS.CURRENT_SONG(
        username,
        songTitle,
        artistName,
        _.get(trackData, 'is_playing'),
        progressHumanized,
        durationHumanized
      )
    };
  } catch (error) {
    return handleSpotifyError(error, username, Commons);
  }
};

module.exports.invocation = music;
