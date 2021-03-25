#!/usr/bin/env node
'use strict';

const mysql = require('mysql2');
const database = require('../credentials/login.js').con
const got = require('got');

const doQueryIn = (query, data = []) => new Promise((resolve, reject) => {
    database.execute(mysql.format(query, data), (err, results) => {
        if (err) {
            reject(err);
        } else {
            resolve(results);
        }
    });
});

exports.doQuery = (query) => new Promise((resolve, reject) => {
    database.query(mysql.format(query), async(err, results) => {
        if (err) {
            console.log(err)

            await doQueryIn(`
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
            await doQueryIn(`
                INSERT INTO error_logs (error_message, date)
                VALUES (?, CURRENT_TIMESTAMP)`,
                [JSON.stringify(err)]);
            reject(err);
        } else {
            resolve(results);
        }
    });
});

// check for banphrases
exports.banphrasePass = (output, channel) => new Promise(async (resolve, reject) => {
    this.channel = channel.replace('#', '');

    this.data = await doQueryIn(`
        SELECT *
        FROM channel_banphrase_apis
        WHERE channel=?`,
        [this.channel]);

    if (!this.data.length) {
        resolve({banned: output});
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
    const checkPermissionList = await doQueryIn(`
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
    await doQueryIn(`
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
exports.hasNumber = (myString) => {
    return /\d/.test(myString);
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
            .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
            .split(' ')
            .splice(splice)
            .filter(Boolean);
    }
    return message
        .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
        .split(' ')
        .splice(2)
        .filter(Boolean);
}

exports.strictChannels = (channel) => {
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
        case "400":
            return `error 400 Bad Request - the server could not understand
            the request due to invalid syntax.`;

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
    constructor(user, commands, message, permissions) {
        this.userId = user["user-id"];
        this.command = commands[message[1].toLowerCase()].name.replace('kb ', '');
        this.permissions = permissions;
        this.key = `${this.userId}_${this.command}`;
    }

    // reduce cooldowns for users with permissions
    async cooldownReduction() {
        const cooldown = Number((await doQueryIn(`
            SELECT cooldown
            FROM commands
            WHERE command=?`,
            [this.command])
        )[0].cooldown);

        const sub = (val) => {
            return cooldown - (cooldown * val);
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
        if (this.userId === "178087241") { return [] };

        if (talkedRecently.has(this.key)) { return [this.key]; }

        talkedRecently.add(this.key);

        setTimeout(() => {
            talkedRecently.delete(this.key);
        }, await this.cooldownReduction());
        return [];
    }

    // cooldown between command uses
    async setGlobalCooldown() {
        if (this.userId === "178087241") { return [] };

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
            .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
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
