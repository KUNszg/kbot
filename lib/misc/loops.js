#!/usr/bin/env node
'use strict';

const got = require('got');
const fs = require('fs');
const _ = require('lodash');

const creds = require('../credentials/config.js');
const utils = require('../utils/utils.js');

const serviceConnector = require('../../connector/serviceConnector');

(async () => {
  const kb = await serviceConnector.Connector.dependencies(['tmi', 'redis', 'sql']);

  const currDate = new Date();

  const supibotStatusUpdate = async () => {
    try {
      const token = await kb.sqlClient.query(`
            SELECT *
            FROM access_token
            WHERE platform="supibot"`);

      await got(
        `https://supinic.com/api/bot-program/bot/active?auth_user=${token[0].user}&auth_key=${token[0].access_token}`,
        {
          method: 'PUT',
        }
      ).json();
    } catch (err) {
      console.log(
        `Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${
          err?.response?.requestUrl ?? 'nourl'
        }`
      );
      utils.errorLog(
        `Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${
          err?.response?.requestUrl ?? 'nourl'
        }`
      );
    }
  };



  const updateAllEmotes = async channelName => {
    try {
      const emotes = await kb.sqlClient.query(
        `
            SELECT *
            FROM emotes
            WHERE channel=?`,
        [channelName]
      );

      const userId = await kb.sqlClient.query(
        `
            SELECT *
            FROM channels_logger
            WHERE channel=?`,
        [channelName]
      );

      // 7TV

      /* try {
        const seventvEmotes = await got(
          `https://api.7tv.app/v2/users/${userId[0].userId}/emotes`
        ).json();

        if (seventvEmotes.length) {
          // check if emote exists in database
          // if not, add it
          const checkForRepeatedEmotesSeventv = async (emote, id, type) => {
            if (typeof seventvEmotes.message != 'undefined' || !seventvEmotes) {
              return '';
            }

            const updateEmotes = emotes.find(i => i.sevenTvId === id);
            if (!updateEmotes) {
              const findEmote = seventvEmotes.filter(i => i.id === id);
              const emoteLink = findEmote[0].urls[0][1];

              await kb.sqlClient.query(
                `
                            INSERT INTO emotes (userId, channel, emote, url, type, sevenTvId, date)
                            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [userId[0].userId, channelName, emote, emoteLink, type, id]
              );
            }
          };

          // iterate through 7TV emotes
          // and check if any of the emotes doesn't exist in the set anymore
          for (let j = 0; j < emotes.length; j++) {
            if (typeof seventvEmotes.message != 'undefined' || !seventvEmotes) {
              return '';
            }

            if (emotes[j].type === '7tv') {
              if (!seventvEmotes.some(i => emotes[j].sevenTvId === i.id)) {
                await kb.sqlClient.query(
                  `
                                DELETE FROM emotes
                                WHERE ID=?`,
                  [emotes[j].ID]
                );

                await kb.sqlClient.query(
                  `
                                INSERT INTO emotes_removed (userId, channel, emote, url, sevenTvId, date, type)
                                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, "7tv")`,
                  [
                    userId[0].userId,
                    channelName,
                    emotes[j].emote,
                    emotes[j].url,
                    emotes[j].sevenTvId,
                  ]
                );
              }
            }
          }
          seventvEmotes.map(i => checkForRepeatedEmotesSeventv(i.name, i.id, '7tv'));
        }
      } catch (err) {}*/

      // BTTV

      try {
        const bttvEmotes = await got(
          `https://api.betterttv.net/3/cached/users/twitch/${userId[0].userId}`
        ).json();

        const allBttvEmotes = bttvEmotes.channelEmotes.concat(bttvEmotes.sharedEmotes);

        // check if emote exists in database
        // if not, add it
        const checkForRepeatedEmotesBttv = async (emote, id, type) => {
          if (typeof bttvEmotes.message != 'undefined' || !bttvEmotes) {
            return '';
          }

          const updateEmotes = emotes.find(
            i =>
              i.url.replace('https://cdn.betterttv.net/emote/', '').replace('/1x', '') === id
          );
          if (!updateEmotes) {
            const findEmote = allBttvEmotes.filter(i => i.id === id);
            const emoteLink = `https://cdn.betterttv.net/emote/${findEmote[0].id}/1x`;

            await kb.sqlClient.query(
              `
                        INSERT INTO emotes (userId, channel, emote, url, type, date)
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [userId[0].userId, channelName, emote, emoteLink, type]
            );
          }
        };

        // iterate through BTTV emotes
        // and check if any of the emotes doesn't exist in the set anymore
        for (let j = 0; j < emotes.length; j++) {
          if (typeof bttvEmotes.message != 'undefined' || !bttvEmotes) {
            break;
          }

          if (emotes[j].type === 'bttv') {
            if (
              !allBttvEmotes.some(
                i =>
                  emotes[j].url
                    .replace('https://cdn.betterttv.net/emote/', '')
                    .replace('/1x', '') === i.id
              )
            ) {
              await kb.sqlClient.query(
                `
                            DELETE FROM emotes
                            WHERE ID=?`,
                [emotes[j].ID]
              );

              await kb.sqlClient.query(
                `
                            INSERT INTO emotes_removed (userId, channel, emote, url, date, type)
                            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, "bttv")`,
                [userId[0].userId, channelName, emotes[j].emote, emotes[j].url]
              );
            }
          }
        }
        allBttvEmotes.map(i => checkForRepeatedEmotesBttv(i.code, i.id, 'bttv'));
      } catch (err) {}

      // FFZ

      try {
        const ffzEmotes = await got(
          `https://api.frankerfacez.com/v1/room/id/${userId[0].userId}`
        ).json();

        const setId = Object.keys(ffzEmotes.sets)[0];

        const checkForRepeatedEmotesFfz = async (emote, id, type) => {
          if (typeof ffzEmotes.error != 'undefined' || !ffzEmotes) {
            return '';
          }

          const updateEmotes = emotes.find(i => i.emoteId === id);
          if (!updateEmotes) {
            const findEmote = ffzEmotes.sets[setId].emoticons.filter(i => i.id === id);

            await kb.sqlClient.query(
              `
                        INSERT INTO emotes (userId, channel, emote, url, emoteId, type, date)
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [userId[0].userId, channelName, emote, findEmote[0].urls['1'], id, type]
            );
          }
        };

        // iterate through FFZ emotes
        // and check if any of the emotes doesn't exist in the set anymore
        for (let j = 0; j < emotes.length; j++) {
          if (typeof ffzEmotes.error != 'undefined' || !ffzEmotes) {
            break;
          }

          if (emotes[j].type === 'ffz') {
            if (!ffzEmotes.sets[setId].emoticons.some(i => emotes[j].emoteId === i.id)) {
              await kb.sqlClient.query(
                `
                            DELETE FROM emotes
                            WHERE ID=?`,
                [emotes[j].ID]
              );

              await kb.sqlClient.query(
                `
                            INSERT INTO emotes_removed (userId, channel, emote, url, emoteId, date, type)
                            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, "ffz")`,
                [
                  userId[0].userId,
                  channelName,
                  emotes[j].emote,
                  emotes[j].url,
                  emotes[j].emoteId,
                ]
              );
            }
          }
        }

        ffzEmotes.sets[setId].emoticons.map(i =>
          checkForRepeatedEmotesFfz(i.name, i.id, 'ffz')
        );
      } catch (err) {}
    } catch (err) {
      if (err.message.includes('404')) {
        return;
      }
      if (err?.status === 404 ?? false) {
        return;
      }
      console.log(
        `Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${
          err?.response?.requestUrl ?? 'nourl'
        }`
      );
      utils.errorLog(
        `Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${
          err?.response?.requestUrl ?? 'nourl'
        }`
      );
    }
  };
  const emoteChecker = async () => {
    const channels = await kb.sqlClient.query(`
        SELECT *
        FROM channels_logger
        WHERE userId != "193071040" AND userId != "229225576"`); // simpdepirulito ksyncbot

    const channelsArr = channels.map(i => i.channel);

    for (let i = 0; i < channelsArr.length; i++) {
      setTimeout(async () => {
        updateAllEmotes(channelsArr[i]);

        await kb.sqlClient.query(`
                UPDATE channels_logger
                SET emotesUpdate="${new Date().toISOString().slice(0, 19).replace('T', ' ')}"
                WHERE channel="${channelsArr[i]}"
                `);
      }, i * 800);
    }
  };

  const twitchToken = async () => {
    try {
      const channels = await kb.sqlClient.query('SELECT * FROM channels');
      const token = await kb.sqlClient.query(
        "SELECT * FROM access_token WHERE platform='twitch'"
      );

      let _channels = channels.map(i => `&user_login=${i.channel}`);

      function* chunks(arr, n) {
        for (let i = 0; i < arr.length; i += n) {
          yield arr.slice(i, i + n);
        }
      }

      _channels = [...chunks(_channels, 99)];

      await kb.sqlClient.query(`UPDATE channels SET status=?, viewerCount=?`, ['offline', 0]);

      for (let i = 0; i < _channels.length; i++) {
        async function timeoutCall() {
          let _query = _channels[i].join('').replace('&', '?');

          const liveStatus = await got(`https://api.twitch.tv/helix/streams${_query}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token[0].access_token}`,
              'Client-ID': creds.client_id,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }).json();

          if (!liveStatus?.data ?? true) {
            return;
          }

          for (let i = 0; i < liveStatus.data.length; i++) {
            const channel = liveStatus.data[i];

            new utils.WSocket('wsl').emit({
              type: 'liveNotif',
              data: {
                status: channel.type,
                username: channel.user_login,
                gameName: channel.game_name,
                viewerCount: channel.viewer_count,
              },
            });

            await kb.sqlClient.query(
              `
                        UPDATE channels
                        SET status=?, viewerCount=?
                        WHERE userId=? AND status="offline"`,
              ['live', channel.viewer_count, channel.user_id]
            );
          }
        }

        // send request for each chunk of channels with 2 seconds timeout
        setTimeout(timeoutCall, 2000);
      }
    } catch (err) {
      console.log(
        `Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${
          err?.response?.requestUrl ?? 'nourl'
        }`
      );
      utils.errorLog(
        `Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${
          err?.response?.requestUrl ?? 'nourl'
        }`
      );
    }
  };

  const updateStats = async () => {
    const userCount = await kb.sqlClient.query('SELECT COUNT(*) as count FROM user_list');
    const commandsCount = await kb.sqlClient.query('SELECT COUNT(*) as count FROM executions');

    const isoDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await kb.sqlClient.query(`
        UPDATE stats
        SET count="${commandsCount[0].count}",
            date="${isoDate}"
        WHERE type="statsApi" AND sha="commandExecs"`);

    await kb.sqlClient.query(`
        UPDATE stats
        SET count="${userCount[0].count}",
            date="${isoDate}"
        WHERE type="statsApi" AND sha="totalUsers"`);

    let userLoggedInCount = await kb.sqlClient.query(`
        SELECT COUNT(*) AS count
        FROM access_token
        WHERE platform="spotify" OR platform="lastfm" AND user IS NOT NULL`);

    let commandExecutionsCount = await kb.sqlClient.query(`
        SELECT COUNT(*) AS count
        FROM executions
        WHERE command LIKE "%spotify%"`);

    [commandExecutionsCount, userLoggedInCount] = [
      _.get(commandExecutionsCount, '0.count'),
      _.get(userLoggedInCount, '0.count'),
    ];

    if (commandExecutionsCount && userLoggedInCount) {
      await kb.redisClient
        .multi()
        .set(
          'kb:api:website-pages:command-executions-count',
          JSON.stringify(commandExecutionsCount)
        )
        .set(
          'kb:api:website-pages:spotify-and-lastfm-user-logged-in-count',
          JSON.stringify(userLoggedInCount)
        )
        .exec();
    }

    new utils.WSocket('wsl').emit({
      type: 'updateCache',
      data: true,
    });
  };

  const fIntervalTime = [
    /*    {
      function: supibotStatusUpdate,
      runOnStart: false,
      interval: 60 * 5,
    },*/
    {
      function: emoteChecker,
      runOnStart: false,
      interval: 60 * 8,
    },
    {
      function: twitchToken,
      runOnStart: false,
      interval: 60,
    },
    {
      function: updateStats,
      runOnStart: true,
      interval: 60 * 20,
    },
  ];

  for (let i = 0; i < fIntervalTime.length; i++) {
    if (fIntervalTime[i].runOnStart) {
      await fIntervalTime[i].function.call();
    }
    setInterval(fIntervalTime[i].function, fIntervalTime[i].interval * 1000);
  }
})();
