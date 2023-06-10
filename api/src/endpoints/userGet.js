const utils = require('../../../lib/utils/utils');
const _ = require('lodash');

const userGet = services => {
  const { app } = services;

  app.get('/api/user', async (req, res) => {
    const userid = _.get(req, 'headers.userid') || _.get(req, 'query.userid');
    const username = _.get(req, 'headers.username') || _.get(req, 'query.username');

    if (!userid && !username) {
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

      const users = await utils.Get.user().byId(user[0].userId);

      const getOptedOut = await utils.Get.user().optout(
        'namechange',
        users[0].userId,
        'userId'
      );

      if (getOptedOut.length && user['user-id'] !== users[0].userId) {
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
        userid: user[0].userId,
        currentUsername: users[users.length - 1].username,
        nameHistory: pastUsernames,
      });

      return null;
    }

    if (userid) {
      const users = await utils.Get.user().byId(userid);

      const getOptedOut = await utils.Get.user().optout(
        'namechange',
        users[0].userId,
        'userId'
      );

      if (!users.length) {
        res.send({
          status: 404,
          message: 'user not found',
        });

        return null;
      }

      if (getOptedOut.length && user['user-id'] !== users[0].userId) {
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
        userid: userid,
        currentUsername: users[users.length - 1].username,
        nameHistory: pastUsernames,
      });
    }
  });
};

module.exports = userGet;
