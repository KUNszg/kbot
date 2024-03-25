const got = require('got');
const _ = require('lodash');
const serviceConnector = require('../../connector/serviceConnector');

const isContentBanphrased = async (content, channel, sqlClient) => {
  channel = channel.replace('#', '');

  if (!sqlClient) {
    const kb = await serviceConnector.Connector.dependencies(['sql']);

    sqlClient = kb.sqlClient;
  }

  const data = await sqlClient.query(
    `
      SELECT *
      FROM channel_banphrase_apis
      WHERE channel=? AND status=?`,
    [channel, 'enabled']
  );

  if (!_.size(data)) {
    return { banned: false };
  }

  return got(encodeURI(_.get(_.first(data), 'url')), {
    method: 'POST',
    body: 'message=' + encodeURIComponent(content),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).json();
};

module.exports = isContentBanphrased;
