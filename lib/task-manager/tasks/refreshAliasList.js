const _ = require('lodash');

const refreshAliasList = async kb => {
  let commands = await kb.sqlClient.query('SELECT aliases, command FROM commands');

  commands = _.filter(commands, Boolean);

  if (!commands) {
    throw new Error("MySql connection error: query on table 'commands' returned no data");
  }

  let aliases = [];

  for (const command of commands) {
    aliases.push(_.split(_.replace(command.aliases, /\//g, command.command), ';'));
  }

  aliases = [].concat.apply([], aliases);

  aliases = aliases.map(aliasRaw => {
    const separateAlias = _.split(aliasRaw, '>');

    const key = _.first(separateAlias);
    const value = _.get(separateAlias, '1');

    JSON.parse(`{"${key}": "${value}"}`);
  });

  await kb.redisClient.set('kb:global:aliases', aliases, 1e8);
};

module.exports = refreshAliasList;
