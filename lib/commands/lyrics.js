#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const creds = require('../credentials/config.js');
const fs = require("fs");

const Genius = require("genius-lyrics");

module.exports = {
    name: "kb lyrics",
    invocation: async (channel, user, message, platform, discord) => {

            if (platform !== "discord") {
                return `${user.username}, command is usable only on Discord so far.`;
            }

            const Client = new Genius.Client();

            const msg = utils.getParam(message.toLowerCase());

            if (!msg[0]) {
                return "you need to provide a song title along with the command";
            }

            const searches = await Client.songs.search(msg.join(" "));

            if (!searches) {
                return "no songs found";
            }

            return "test"

            const lyrics = await searches[0].lyrics();
            const title = searches[0].title;
            const author = searches[0].artist.name;

            const dir = './data/tmp';

            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }

            const randString = utils.genString();

            fs.writeFileSync(`${dir}/lyrics_${randString}.txt`, `${title} \nby ${author} \n\n${lyrics}`);

            discord.channel.send({
                files: [{
                    attachment: `/home/kunszg/kbot/data/tmp/lyrics_${randString}.txt`,
                    name: `${title}_by_${author}.txt`
                }],
                content: "your result: ",
            });

            return "";

    }
}