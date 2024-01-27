#!/usr/bin/env node
'use strict';

const got = require('got');
const _ = require('lodash');

const utils = require('../utils/utils.js');

const serviceConnector = require('../../connector/serviceConnector');

(async () => {
  const kb = await serviceConnector.Connector.dependencies(['tmi', 'redis', 'sql']);

  const currDate = new Date();
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
})();
