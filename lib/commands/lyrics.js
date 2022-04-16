#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const creds = require('../credentials/config.js');
const fs = require("fs");
const {getTracks, getLyrics, setApiKey} = require("@green-code/music-track-data");

setApiKey(creds.randomTrack);

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

            getTracks(msg.join(" "))
                .then(i => {
                    getLyrics(i[0].artist, i[0].title)
                        .then(song => {
                            if (!i.length || !song) {
                                discord.reply("no song/lyrics found");
                                return "";
                            }

                            const dir = './data/tmp';

                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir);
                            }

                            const randString = utils.genString();

                            fs.writeFileSync(`${dir}/lyrics_${randString}.txt`, `${i[0].title} \nby ${i[0].artist}\n` +
                                `album: ${i[0].title}${song.explicit ? "\n\n#WARNING: below lyrics are marked as explicit" : ""} ` +
                                `\n\n${song.lyrics}`);

                            discord.channel.send({
                                files: [{
                                    attachment: `/home/kunszg/kbot/data/tmp/lyrics_${randString}.txt`,
                                    name: `${i[0].title.split(" ").join("_") + "_by_" + i[0].artist.split(" ").join("_")}.txt`
                                }],
                                content: "your result: ",
                            });
                        })
                        .catch(console.log);
                })
                .catch(console.log);

            return "";
        } catch (err) {
            return `no lyrics were found for this song`;
        }
    }
}