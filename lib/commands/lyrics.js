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

            const api = await utils.Get.api().url(message);
            const getLyrics = got(`${api}?title=${encodeURIComponent(msg)}`);

            if (getLyrics.error) {
                return "could not find the song lyrics";
            }

            const dir = '../../data/temp';

            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }

            const randString = utils.genString();

            fs.writeFileSync(`${dir}/lyrics_${randString}`, `${getLyrics.title} by ${getLyrics.author} \n\n ${getLyrics.lyrics}`);
            let fileResult = fs.readFileSync(`${dir}/lyrics_${randString}`);

            fileResult = fileResult.toString();

            discord.reply({ file: fileResult });

            fs.unlinkSync(`${dir}/lyrics_${randString}`);

            return "";
        } catch (err) {
            utils.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`
        }
    }
}