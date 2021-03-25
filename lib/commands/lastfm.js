const utils = require('../utils/utils.js');
const kb = require('../handler.js').kb;
const creds = require('../credentials/config.js');
const got = require('got');

module.exports = {
    name: 'kb lastfm',
    invocation: async (channel, user, message) => {
        // get correct param depending on if message is an alias
        const msg = (message.split(' ')[1] === "lastfm" || message.split(' ')[1] === "music") ?
            utils.getParam(message.toLowerCase()) :
            utils.getParam(message.toLowerCase(), 1);

        // checks if output message is not too long
        class ModifyOutput {
            constructor(input, trim = 30) {
                this.input = input;
                this.trim = trim;
            }

            trimmer() {
                const noPing = (str) => {
                    if (str.toLowerCase() === "constera" || str.toLowerCase() === "nymn") {
                        return str.replace(/^(.{2})/, "$1\u{E0000}");
                    }
                    return str
                }

                if (!Array.isArray(this.input)) {
                    return (this.input.length > this.trim) ?
                        `${noPing(this.input.substr(0, this.trim))}(...)` : noPing(this.input);
                }

                let result = [];

                for (let i = 0; i < this.input.length; i++) {
                    result.push((this.input[i].length > this.trim) ?
                        `${noPing(this.input[i].substr(0, this.trim))}(...)` : noPing(this.input[i]));
                }
                return result;
            }
        }

        /*
        *
        *   LAST.FM INTEGRATION
        *
        */
        try {
            if (msg[0]) {
                if (msg[0].startsWith("@")) {
                    this.msg = msg[0].toLowerCase().replace(/@|,/g, '');

                    const checkIfOptedOut = await utils.query(`
                        SELECT *
                        FROM optout
                        WHERE command=? AND username=?`,
                        ["lastfm", this.msg]);

                    if (checkIfOptedOut.length && (user['username'] != this.msg)) {
                        return `${user['username']}, that user has opted out from being a target of this command.`;
                    }

                    const findUser = await utils.query(`
                        SELECT *
                        FROM user_list
                        WHERE username=?`,
                        [msg[0].toLowerCase().replace(/@|,/g, '')]);

                    if (!findUser.length) {
                        return `${user['username']}, this user does not exist.`;
                    }

                    const userData = await utils.query(`
                        SELECT *
                        FROM access_token
                        WHERE platform="lastfm" AND user=?`,
                        [findUser[0].userId]);

                    if (!userData.length) {
                        return `${user['username']}, this user is not registered for this command.`;
                    }

                    if (userData[0].allowLookup === "N" && user['username'] != msg[0].toLowerCase().replace(/@|,/g, '')) {
                        return `${user['username']}, this user's settings do not allow for a song lookup, ask them to use kb lastfm allow :)`;
                    }

                    const lastfmCurrPlaying = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${userData[0].access_token}&api_key=${creds.lastfmApiKey}&format=json`).json();
                    const lastfm = lastfmCurrPlaying.recenttracks.track[0];

                    if (!lastfm?.['@attr']) {
                        return `${user['username']}, no song is playing on ${findUser[0].username}'s LastFM FeelsDankMan`;
                    }

                    let [playing, artist] = new ModifyOutput([lastfm.name, lastfm.artist['#text']]).trimmer();

                    const response = `Current song playing on ${findUser[0].username}'s LastFM: ${playing} by ${artist} `;

                    try {
                        if (channel === "#forsen") {
                            return response;
                        }

                        const youtube = await utils.youtube(`${lastfm.name} by ${lastfm.artist['#text']}`);
                        return response + `https://youtu.be/${youtube.id}`;
                    } catch (err) {
                        if (err.error?.code === 403) {
                            return response + ' [ran out of youtube queries]';
                        }
                        console.log(err);
                        return `${user['username']}, unexpected error FeelsDankMan`;
                    }
                }
            }

            const userData = await utils.query(`
                SELECT *
                FROM access_token
                WHERE platform="lastfm" AND user=?`,
                [user['user-id']]);

            if (msg[0] === "unregister") {
                if (!userData.length) {
                    return `${user['username']}, you are not registered for lastfm command.`;
                }

                await utils.query(`
                    DELETE FROM access_token
                    WHERE user=? AND platform="lastfm"`,
                    [user['user-id']]);

                return `${user['username']}, you have been successfully unregistered from lastfm command.`;
            }

            if (!userData.length) {
                if (channel === '#forsen') {
                    return `${user['username']}, To get access to lastfm command, follow the login process on kunszg(dot)com/connections`;
                }
                return `${user['username']}, To get access to lastfm command, follow the login process on https://kunszg.com/connections`;
            }

            if (msg[0] === "allow") {
                await utils.query(`
                    UPDATE access_token
                    SET allowLookup="Y"
                    WHERE platform="lastfm" AND user=?`,
                    [user['user-id']]);

                return `${user['username']}, you allowed other registered users to lookup your playing songs.`;
            }

            if (msg[0] === "disallow") {
                await utils.query(`
                    UPDATE access_token
                    SET allowLookup="N"
                    WHERE platform="lastfm" AND user=?`,
                    [user['user-id']]);

                return `${user['username']}, other users won't be able to view your currently playing song anymore.`;
            }

            const lastfmCurrPlaying = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${userData[0].access_token}&api_key=${creds.lastfmApiKey}&format=json`).json();
            const lastfm = lastfmCurrPlaying.recenttracks.track[0];

            if (!lastfm?.['@attr']) {
                return `${user['username']}, no song is playing on your LastFM FeelsDankMan`;
            }

            let [playing, artist] = new ModifyOutput([lastfm.name, lastfm.artist['#text']]).trimmer();

            const response = `Current song playing on ${user['username']}'s LastFM: ${playing} by ${artist} `;

            try {
                if (channel === "#forsen") {
                    return response;
                }

                const youtube = await utils.youtube(`${lastfm.name} by ${lastfm.artist['#text']}`);
                return response + `https://youtu.be/${youtube.id}`;
            } catch (err) {
                if (err.error?.code === 403) {
                    return response + ' [ran out of youtube queries]';
                }
                console.log(err);
                return `${user['username']}, unexpected error FeelsDankMan`;
            }
        } catch (err) {
            console.log(err)
            if (err.response?.statusCode ?? false) {
                return `${user['username']}, ${utils.status(err.response.statusCode)} FeelsDankMan`;
            }

            return `${user['username']}, no song is playing on your LastFM FeelsDankMan`;
        }
    }
}