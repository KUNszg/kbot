#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const got = require('got');
const creds = require('../credentials/config.js');

module.exports = {
    name: "kb dank",
    invocation: async (channel, user, message) => {
        try {
            if (await utils.checkPermissions(user['username'])<2) {
                return '';
            }

            const msg = (message.split(' ')[1].toLowerCase() === "title" || message.split(' ')[1].toLowerCase() === "game") ?
                utils.getParam(message, 1) :
                utils.getParam(message);

            const getAccessToken = await utils.query(`SELECT * FROM access_token`);

            const owner = await utils.Get.user().owner();

            if (msg[0] === "title") {
                await got(`https://api.twitch.tv/helix/channels?broadcaster_id=${owner[0].userId}&title=${encodeURI(msg.splice(1).join(' '))}`, {
                    method: "PATCH",
                    headers: {
                        'Authorization': `Bearer ${getAccessToken[0].access_token}`,
                        'Client-ID': creds.client_id,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                });

                return `${user['username']}, done`;
            }

            if (msg[0] === "game") {
                const gameId = await got(`https://api.twitch.tv/helix/games?name=${encodeURI(msg.splice(1).join(' '))}`, {
                    method: "GET",
                    headers: {
                        'Authorization': `Bearer ${getAccessToken[0].access_token}`,
                        'Client-ID': creds.client_id,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                }).json();

                if (!gameId.data.length) {
                    return `${user['username']}, specified category was not found.`;
                }

                await got(`https://api.twitch.tv/helix/channels?broadcaster_id=${owner[0].userId}&game_id=${gameId.data[0].id}`, {
                    method: "PATCH",
                    headers: {
                        'Authorization': `Bearer ${getAccessToken[0].access_token}`,
                        'Client-ID': creds.client_id,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                });

                return `${user['username']}, changed category to ${gameId.data[0].name}`;
            }

            return `${user['username']}, invalid type.`;
        } catch (err) {
            utils.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}
