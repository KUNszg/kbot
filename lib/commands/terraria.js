#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const creds = require('../credentials/config.js');
const kb = require('../handler.js').kb;
const fetch = require('node-fetch');
const prefix = "kb ";

module.exports = {
    name: prefix + 'terraria',
    aliases: null,
    description: `commands fetching data from my Terraria server. Whisper/ping KUNszg for server IP. Parameters: https://pastebin.com/UxNvgiWi -- cooldown 4s`,
    description_formatted: `commands fetching data from my Terraria server. Whisper/ping KUNszg for server IP. Parameters: pastebin (dot) com/UxNvgiWi -- cooldown 4s`,
    permission: 0,
    cooldown: 8000,
    invocation: async (channel, user, message, args) => {
        try {

            const msg = message
                .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
                .split(' ')
                .splice(2)
                .filter(Boolean);

            async function endpoint(input) {
                if (input.includes('?')) {
                    const terraria = await fetch(`${creds.terrariaIP}${input}&token=${creds.terraria}`)
                        .then(response => response.json());
                    return terraria;
                }
                const terraria = await fetch(`${creds.terrariaIP}${input}?token=${creds.terraria}`)
                    .then(response => response.json());
                return terraria;
            }

            if (msg[0].startsWith('/')) {
                if (user['username']!='kunszg') {
                    return '';
                }
                const cmd = await endpoint('/v3/server/rawcmd?cmd=' + msg.join(' '));

                return `${user['username']}, ${cmd.response.join(' ')}`;
            }

            if (!msg[0]) {
                return `${user['username']}, no parameter provided`;
            }

            switch (msg[0]) {
                case 'save':
                    if (await custom.checkPermissions(user['username'])==-1 || await custom.checkPermissions(user['username'])>3) {
                        await endpoint('/v2/world/save');
                        return `${user['username']}, Terraria world has been saved.`;
                    }
                    break

                case 'bc':
                case 'broadcast':
                    if (await custom.checkPermissions(user['username'])==-1 || await custom.checkPermissions(user['username'])>3) {
                        await endpoint(encodeURI('/v2/server/broadcast?msg=' + msg.splice(1).join(' ')));
                        return `${user['username']}, message was sent to server.`;
                    }
                    break;

                case 'reload':
                    if (await custom.checkPermissions(user['username'])!=5) {
                        return '';
                    }
                    const reload = await endpoint('/v3/server/reload');
                    return `${user['username']}, ${reload.response}`;

                case 'info':
                    const world = await endpoint('/world/read');
                    return `${user['username']}, world difficulty: master / world size: ${world.size} / world time:
                    ${world.daytime ? 'day' : 'night'} / ${world.bloodmoon ? 'bloodmoon: on' : 'bloodmoon: off'} /
                    ${world.invasionsize===0 ? 'no active invasion' : 'current invasion level: ' + world.invasionsize}`;

                case 'list':
                    const playing = await endpoint('/v2/players/list');
                    if (playing.players.length===0) {
                        return `${user['username']}, no one is online FeelsBadMan`;
                    }
                    console.log(playing.players.map(i=>i.nickname + ' (active: ' + i.active + ')').join(', '))
                    kb.whisper(user['username'], 'list of online users: ' + playing.players.map(i=>i.nickname + ' (active: ' + i.active + ')'));
                    if (playing.players.length===1) {
                        return `${user['username']}, there is ${playing.players.length} online player on my terraria server, check whispers for username.`;
                    }
                    if (playing.players.length>1) {
                        return `${user['username']}, there are ${playing.players.length} online players on my terraria server, check whispers for usernames.`;
                    }

                case 'motd':
                     const motd = await endpoint('/v3/server/motd');
                     return `${user['username']}, motd: ${motd.motd[0]}`;

                case 'server':
                    const server = await endpoint('/v2/server/status');
                    return `${user['username']}, version: ${server.serverversion} / max players: ${server.maxplayers} / uptime: ${server.uptime}`;


                default:
                    return `${user['username']}, this parameter does not exist.`;
            }

        } catch (err) {
            custom.errorLog(err)
            return `${user['username']} ${err} FeelsDankMan !!!`;
        }
    }
}
