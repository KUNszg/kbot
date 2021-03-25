#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const kb = require('../handler.js').kb;
const got = require('got');

// allow only one execution at the same time
const stallTheCommand = new Set();

module.exports = {
    stall: stallTheCommand,
    name: "kb 4Head",
    invocation: async (channel, user, message, platform) => {
        try {
            if (stallTheCommand.has('busy')) {
                return '';
            }
            stallTheCommand.add('busy');
            setTimeout(()=>{
                stallTheCommand.delete('busy');
            }, 6000);

            const arr = [
                'general',
                'programming'
            ];

            const randomPs = arr[Math.floor(Math.random() * arr.length)];

            const joke = await got('https://official-joke-api.appspot.com/jokes/programming/random').json()
            if (randomPs === 'programming') {

                setTimeout(() => {
                    if (platform === "whisper") {
                        kb.whisper(user['username'], `${utils.lCase(joke[0].punchline.replace(/\./g, ''))} 4Head`);
                        return '';
                    }
                    kb.say(channel, `${utils.lCase(joke[0].punchline.replace(/\./g, ''))} 4Head`);
                }, 3000);

                setTimeout(() => {
                    stallTheCommand.delete('busy');
                }, 4500);

                return `${user['username']}, ${utils.lCase(joke[0].setup)}`;
            }
            if (randomPs === 'general') {
                const jokeGeneral = await got('https://official-joke-api.appspot.com/random_joke').json()

                setTimeout(() => {
                    if (platform === "whisper") {
                        kb.whisper(user['username'], `${utils.lCase(joke[0].punchline.replace(/\./g, ''))} 4Head`);
                        return '';
                    }
                    kb.say(channel, `${utils.lCase(jokeGeneral.punchline.replace(/\./g, ''))} 4Head`);
                }, 3000);

                setTimeout(() => {
                    stallTheCommand.delete('busy');
                }, 4500);

                return `${user['username']}, ${utils.lCase(jokeGeneral.setup)}`;
            }
        } catch (err) {
            utils.errorLog(err)
            return `${user['username']} ${err} FeelsDankMan !!!`;
        }
    }
}
