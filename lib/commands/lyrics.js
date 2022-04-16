#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const creds = require('../credentials/config.js');
const fs = require("fs");
const { getLyrics, getSong } = require('genius-lyrics-api');

module.exports = {
    name: "kb lyrics",
    invocation: async (channel, user, message, platform, discord) => {
        try {
            if (platform !== "discord") {
                return `${user.username}, command is usable only on Discord so far.`;
            }

            const msg = utils.getParam(message.toLowerCase());

            if (!msg[0]) {
                return "you need to provide a song title along with the command";
            }

            const options = {
                apiKey: creds.genius,
                title: msg.join(" "),
                artist: ' ',
                optimizeQuery: true
            };

            getSong(options).then((song) => {
                    if (!song) {
                        return "no lyrics/song was found"
                    }

                    const dir = './data/tmp';

                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }

                    const randString = utils.genString();

                    fs.writeFileSync(`${dir}/lyrics_${randString}.txt`, `${song.title} \n\n${song.lyrics}`);

                    discord.channel.send({
                        files: [{
                            attachment: `/home/kunszg/kbot/data/tmp/lyrics_${randString}.txt`,
                            name: `${song.title.split(" ").join("_")}.txt`
                        }],
                        content: "your result: ",
                    })
                }
            )

            return "";
        } catch (err) {
            return `no lyrics were found for this song`;
        }
    }
}