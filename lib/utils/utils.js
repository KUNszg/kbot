#!/usr/bin/env node
'use strict';

const mysql = require('mysql2');
const database = require('../credentials/login.js').con;
const regex = require('./regex.js');
const utils = require('./utils.js')
const got = require('got');

exports.doQuery = (query) => new Promise((resolve, reject) => {
    database.query(mysql.format(query), async(err, results) => {
        if (err) {
            console.log(err)
            await utils.query(`
                INSERT INTO error_logs (error_message, date)
                VALUES (?, CURRENT_TIMESTAMP)`,
                [JSON.stringify(err)]);
            reject(err);
        } else {
            resolve(results);
        }
    });
});

exports.query = (query, data = []) => new Promise((resolve, reject) => {
    database.execute(mysql.format(query, data), async(err, results) => {
        if (err) {
            console.log(query, '\n//\n', err);
            await utils.query(`
                INSERT INTO error_logs (error_message, date)
                VALUES (?, CURRENT_TIMESTAMP)`,
                [JSON.stringify(err)]);
            reject(err);
        } else {
            resolve(results);
        }
    });

    database.unprepare(query);
});

// check for banphrases
exports.banphrasePass = (output, channel) => new Promise(async (resolve, reject) => {
    this.channel = channel.replace('#', '');

    this.data = await utils.query(`
        SELECT *
        FROM channel_banphrase_apis
        WHERE channel=? AND status="enabled"`,
        [this.channel]);

    if (!this.data.length) {
        resolve({banned: false});
        return;
    }

    this.banphrase = await got(this.data[0].url, {
            method: "POST",
            body: "message=" + output,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
        }).json();

    resolve(this.banphrase);
});

// check for user permissions with database
exports.checkPermissions = async (username) => {
    const checkPermissionList = await utils.query(`
        SELECT *
        FROM trusted_users
        WHERE username=?`,
        [username]);

    if (checkPermissionList.length === 0 || checkPermissionList[0].status === "inactive") {
        return 0;
    }
    return checkPermissionList[0].permissions.split(':')[0];
}

// insert error to database if one occurs
exports.errorLog = async (err) => {
    await utils.query(`
        INSERT INTO error_logs (error_message, date)
        VALUES (?, ?)`,
        [((err?.message ?? true) ? JSON.stringify(err) : err.message), new Date()]);
}

exports.format = (seconds) => {
    var hours = Math.floor(seconds / (60 * 60));
    var minutes = Math.floor(seconds % (60 * 60) / 60);
    var seconds = Math.floor(seconds % 60);
    if (hours === 0 && minutes != 0) {
        return minutes + 'm ' + seconds + "s";
    } else {
        if (minutes === 0 && hours === 0) {
            return seconds + "s"
        } else {
            return hours + 'h ' + minutes + 'm ' + seconds + "s";
        }
    }
}

exports.capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// check if string contains number
exports.hasNumber = (str) => {
    return /\d/.test(str);
}

// get unicode code of given character
exports.escapeUnicode = (str) => {
    return str.replace(/[^\0-~]/g, function(ch) {
        return "\\u{" + ("000" + ch.charCodeAt().toString(16)).slice(-4) + '}';
    });
}

exports.lCase = (string) => {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

// replace invisible character in message and get parameters from the message
exports.getParam = (message, splice) => {
    if (splice) {
        return message
            .replace(regex.invisChar, '')
            .split(' ')
            .splice(splice)
            .filter(Boolean);
    }
    return message
        .replace(regex.invisChar, '')
        .split(' ')
        .splice(2)
        .filter(Boolean);
}

exports.strictChannels = (channel, cooldown) => {
    if (cooldown) {
        const channels = [
            '#forsen',
            '#vadikus007',
            '#zoil',
            '#cyr',
            '#weest',
            '#nymn'
        ];
        const currentChannel = channels.filter(i => i === channel);
        if (!currentChannel.length) {
            return false
        }
        return true
    }

    const channels = [
        '#nymn',
        '#forsen',
        '#vadikus007',
        '#pajlada',
        '#zoil'
    ];
    const currentChannel = channels.filter(i => i === channel);
    if (!currentChannel.length) {
        return false
    }
    return true
}

exports.ignore = (channel) => {
    const channels = [
        '#zoil'
    ];
    const currentChannel = channels.filter(i => i === channel);
    if (!currentChannel.length) {
        return true
    }
    return false
}

exports.random = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
}

const { YTSearcher } = require('ytsearcher');
const creds = require('../credentials/config.js');
const searcher = new YTSearcher(creds.youtube);
exports.youtube = async (query, results) => {
    const result = await searcher.search(query, { type: 'video' });
    return result.first;
}

const humanize = require('humanize-duration');
const shortHumanize = humanize.humanizer({
    language: 'shortEn',
    languages: {
        shortEn: {
            y: () => 'y',
            mo: () => 'mo',
            w: () => 'w',
            d: () => 'd',
            h: () => 'h',
            m: () => 'm',
            s: () => 's',
        },
    },
});
exports.humanizeDuration = (seconds) => {
    const options = {
        units: ['y', 'mo', 'd', 'h', 'm', 's'],
        largest: 3,
        round: true,
        spacer: '',
    };
    return shortHumanize(seconds*1000, options);
}

exports.genString = (length = 15) => {
   let result = '';
   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
   }
   return result;
}

exports.status = (code) => {
    switch (String(code)) {
        // 1xx informational response
        case "100":
            return "[info resp 100 Continue] - The server has received the request headers " +
            "and the client should proceed to send the request body (POST request).";

        case "101":
            return "[info resp 101 Switching Protocols] - The requester has asked the server " +
            "to switch protocols and the server has agreed to do so.";

        case "102":
            return "[info resp 102 Processing] - A WebDAV request may contain many sub-requests " +
            "involving file operations, requiring a long time to complete the request.";

        case "103":
            return "[info resp 103 Early Hints] - returning response headers before final HTTP message."

        // 2xx success
        case "200":
            return "[success 200 OK] - successful HTTP response.";

        case "201":
            return "[success 200 Created] - The request has been fulfilled, resulting in the creation of a new resource.";

        case "202":
            return "[success 202 Accepted] - The request has been accepted for processing, but the processing has not been completed. ";

        // 4xx client errors
        case "400":
            return "error 400 Bad Request - the server could not understand the request due to invalid syntax.";

        case "401":
            return `error 401 Unauthorized - my bot is not authorized to resolve
            this request.`;

        case "403":
            return `error 403 Forbidden - the server understood the request, but
            is refusing to fulfill it`;

        case "404":
            return `error 404 Not Found - Service is most likely down`;

        case "405":
            return `error 405 Method Not Allowed - The request method is known
            by the server but has been disabled and cannot be used`;

        case "408":
            return `error 408 Request Timeout - connection timed out.`;

        case "429":
            return `error 429 Too Many Requests - my bot is sending too many
            queries at once, rate limiting has been applied`;

        case "500":
            return `error 500 - Internal Server Error`;

        case "502":
            return `error 502 Bad Gateway - the server was acting as a gateway or
            proxy and received an invalid response from the upstream server`;

        case "503":
            return `error 503 Service Unavailable - the server is currently unable
            to handle the request due to a temporary condition.`;

        default:
            return `unexpected error status`;
    }
}

const talkedRecently = new Set();

exports.Cooldown = class Cooldown {
    constructor(user, commands, message, permissions, platform) {
        this.userId = user["user-id"];
        this.command = commands[message[1].toLowerCase()].name.replace('kb ', '');
        this.permissions = permissions;
        this.key = `${this.userId}_${this.command}`;
        this.platform = platform;
    }

    // reduce cooldowns for users with permissions
    async cooldownReduction() {
        let cooldown = await utils.query(`
            SELECT cooldown
            FROM commands
            WHERE command=?`, [this.command])

        if (!cooldown.length) {
            return 5000;
        }

        if (typeof cooldown[0].cooldown === "undefined") {
            return 5000;
        }

        cooldown = cooldown[0].cooldown;

        const sub = (val) => {
            return cooldown - (cooldown * val);
        }

        if (this.platform === "discord") {
            return cooldown
        }

        switch (this.permissions) {
            case 1:
                return sub(0.3); // reduce cooldown by 30% for permission 1

            case 2:
                return sub(0.50);

            case 3:
                return sub(0.65);

            case 4:
                return sub(0.70);

            case 5:
                return sub(0.80);

            default:
                return cooldown;
        }
    }

    // command cooldown
    async setCooldown() {
        if (this.userId === "178087241" && this.platform != "discord") { return [] };

        if (talkedRecently.has(this.key)) { return [this.key]; }

        talkedRecently.add(this.key);

        setTimeout(() => {
            talkedRecently.delete(this.key);
        }, await this.cooldownReduction());
        return [];
    }

    // cooldown between command uses
    async setGlobalCooldown() {
        if (this.userId === "178087241" && this.platform != "discord") { return [] };

        if (talkedRecently.has(this.userId)) { return [this.key]; }

        talkedRecently.add(this.userId);

        setTimeout(() => {
            talkedRecently.delete(this.userId);
        }, 3000);
        return [];
    }
}

const aliasList = require('../../data/aliases.json');

exports.Alias = class Alias {
    constructor(message) {
        this.command = message
            .replace(regex.invisChar, '')
            .split(' ')
            .splice(1)
            .filter(Boolean)[0];
        this.alias = aliasList.filter(i => i[this.command]);
    }

    convertToRegexp(input) {
        return new RegExp(`\\b${input}\\b`, "i")
    }

    getRegex() {
        if (this.alias.length) {
            return this.convertToRegexp(Object.keys(this.alias[0]));
        }
        return '';
    }

    getReplacement() {
        if (this.alias.length) {
            return Object.values(this.alias[0])[0];
        }
        return '';
    }
}

exports.Get = {
    user(userstate) {
        if (userstate) {
            return utils.query(`
                SELECT *
                FROM user_list
                WHERE userId=?`, [userstate['user-id']]);
        }
        return Object.create(this.userData)
    },

    userData: {
        byUsername: function (username) {
            return utils.query(`
                SELECT *
                FROM user_list
                WHERE username=?`, [username]);
        },

        byId: function (userId) {
            return utils.query(`
                SELECT *
                FROM user_list
                WHERE userId=?`, [userId]);
        },

        banned: function (userstate) {
            return utils.query(`
                SELECT *
                FROM ban_list
                WHERE user_id=?`,
                [userstate['user-id']]);
        },

        optout: function (command, user, column) {
            return utils.query(`
                SELECT *
                FROM optout
                WHERE command=? AND ${column}=?`,
                [command, user]);
        }
    },

    channel(channelName) {
        if (channelName) {
            return utils.query(`
                SELECT *
                FROM channels
                WHERE channel=?`,
                [channelName.replace('#', '')]);
        }
        return Object.create(this.channelData)
    },

    channelData: {
        isStrictAndLive: async function (channelName) {
            this.data = await utils.query(`
                SELECT *
                FROM channels
                WHERE channel=?`,
                [channelName.replace('#', '')]);

            return this.data[0].status === "live"  && this.data[0].strict === "Y" ? true : false;
        }
    }
};

exports.Log = {
    exec(user, input, result, channel) {
        this._result = (typeof result === "undefined" || !result) ? '' : result.replace(regex.invisChar, '');
        utils.query(`
            INSERT INTO executions (username, command, result, channel, date)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [user['username'], input.join(' '), this._result, channel.replace('#', '')]);
    }
}
