#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const kb = require('../handler.js').kb;

// allow only one execution at the same time
const stallTheCommand = new Set();

module.exports = {
    stall: stallTheCommand,
    name: "kb 4Head",
    invocation: async (channel, user, message, platform, _platform, discordMessageObj) => {
        try {
            if (stallTheCommand.has('busy')) {
                return '';
            }
            stallTheCommand.add('busy');
            setTimeout(()=>{
                stallTheCommand.delete('busy');
            }, 6000);

            const joke = await kb.query("SELECT * FROM jokes ORDER BY RAND() LIMIT 1");

            setTimeout(() => {
                if (platform === "whisper") {
                    kb.whisper(user['username'], `${utils.lCase(joke[0].punchline.replace(/\./g, ''))} 4Head`);
                }
                else {
                    kb.say(channel, `${utils.lCase(joke[0].punchline.replace(/\./g, ''))} 4Head`);
                }
            }, 3000);

            setTimeout(() => { stallTheCommand.delete('busy') }, 4500);

            if (_platform === "discord") {
                discordMessageObj.channel.send(utils.lCase(joke[0].setup))
                    .then(setTimeout((sentMessage) => {
                        sentMessage.edit(utils.lCase(joke[0].setup) + "\n\n" + utils.lCase(joke[0].punchline.replace(/\./g, '')))
                    }, 3000));
                return "";
            }

            return `${user['username']}, ${utils.lCase(joke[0].setup)}`;
        } catch (err) {
            utils.errorLog(err)
            return `${user['username']} ${err} FeelsDankMan !!!`;
        }
    }
}
