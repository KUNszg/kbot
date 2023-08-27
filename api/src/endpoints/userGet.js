const utils = require('../../../lib/utils/utils');
const _ = require('lodash');

const userGet = services => {
  const { app } = services;

  app.get('/api/user', async (req, res) => {
    const receivedUserId = _.get(req, 'headers.userid') || _.get(req, 'query.userid');
    const username = _.get(req, 'headers.username') || _.get(req, 'query.username');

    if (!receivedUserId && !username) {
      res.send({
        status: 400,
        message: 'bad request',
      });

      return null;
    }

    if (username) {
      const user = await utils.Get.user().byUsername(username.toLowerCase());

      if (!user.length) {
        res.send({
          status: 404,
          message: 'user not found',
        });

        return null;
      }

      const users = await utils.Get.user().byId(_.get(user, "0.userId"));

      const userId = _.get(users, "0.userId");

      const getOptedOut = await utils.Get.user().optout(
        'namechange',
        userId,
        'userId'
      );

      if (getOptedOut.length) {
        res.send({
          status: 403,
          message: 'user has opted out from being searched by this endpoint',
        });

        return null;
      }

      const pastUsernames = users.map(({ username, userId, color, added }) => ({
        username: username,
        color: color,
        foundUTC: added,
        foundTimestamp: Date.parse(added),
      }));

      res.send({
        status: 200,
        userid: userId,
        currentUsername: users[users.length - 1].username,
        nameHistory: pastUsernames,
      });

      return null;
    }

    if (receivedUserId) {
      const users = await utils.Get.user().byId(receivedUserId);

      const userId = _.get(users, "0.userId");

      const getOptedOut = await utils.Get.user().optout(
        'namechange',
        userId,
        'userId'
      );

      if (!users.length) {
        res.send({
          status: 404,
          message: 'user not found',
        });

        return null;
      }

      if (getOptedOut.length) {
        res.send({
          status: 403,
          message: 'user has opted out from being searched by this endpoint',
        });

        return null;
      }

      const pastUsernames = users.map(({ username, color, added }) => ({
        username: username,
        color: color,
        foundUTC: added,
        foundTimestamp: Date.parse(added),
      }));

      res.send({
        status: 200,
        userid: userId,
        currentUsername: users[users.length - 1].username,
        nameHistory: pastUsernames,
      });
    }
  });
};

module.exports = userGet;
