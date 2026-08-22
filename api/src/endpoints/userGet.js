const _ = require('lodash');

const userGet = services => {
  const { app, Commons } = services;

  const sendErrorResponse = (res, status, message) => {
    res.send({
      status,
      message,
    });
  };

  const processUser = async (res, userRepository, userId) => {
    const users = await userRepository.getUser({ userId });

    if (!users.length) {
      return sendErrorResponse(res, 404, 'user not found');
    }

    const isOptedOut = await userRepository.isUserOptedOut('namechange', userId);

    if (isOptedOut) {
      return sendErrorResponse(
        res,
        403,
        'user has opted out from being searched by this endpoint'
      );
    }

    const pastUsernames = users.map(({ username, color, added }) => ({
      username,
      color,
      foundUTC: added,
      foundTimestamp: Date.parse(added),
    }));

    res.send({
      status: 200,
      userid: userId,
      currentUsername: users[users.length - 1].username,
      nameHistory: pastUsernames,
    });
  };

  app.get('/api/user', async (req, res) => {
    const receivedUserId = _.get(req, 'headers.userid') || _.get(req, 'query.userid');
    const receivedUsername = _.get(req, 'headers.username') || _.get(req, 'query.username');

    if (!receivedUserId && !receivedUsername) {
      return sendErrorResponse(res, 400, 'bad request');
    }

    const userRepository = Commons.UserRepository(Commons.ServiceConnector.Connector);

    if (receivedUsername) {
      const user = await userRepository.getUser({ username: receivedUsername });

      if (!user.length) {
        return sendErrorResponse(res, 404, 'user not found');
      }

      const userId = _.get(user, '0.userId');
      await processUser(res, userRepository, userId);
    } else if (receivedUserId) {
      await processUser(res, userRepository, receivedUserId);
    }
  });
};

module.exports = userGet;
