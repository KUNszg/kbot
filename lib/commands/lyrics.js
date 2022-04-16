#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const got = require("got");
const fs = require("fs");

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

            const api = await utils.Get.api().url(message);
            const getLyrics = await got(`${api}?title=${encodeURIComponent(msg)}`).json();

            if (getLyrics.error) {
                return "could not find the song lyrics";
            }

            const dir = './data/tmp';

            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }

            const randString = utils.genString();

            fs.writeFileSync(`${dir}/lyrics_${randString}.txt`, `${getLyrics.title} \nby ${getLyrics.author} \n\n${getLyrics.lyrics}`);

            discord.channel.send({
                files: [{
                    attachment: `/home/kunszg/kbot/data/tmp/lyrics_${randString}.txt`,
                    name: `${getLyrics.title}_by_${getLyrics.author}.txt`
                }],
                content: "your result: ",
            });

            return "";
        } catch (err) {
            utils.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`
        }
    }
}