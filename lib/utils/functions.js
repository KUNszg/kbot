#!/usr/bin/env node
'use strict';

const mysql = require('mysql2');
const database = require('../credentials/login.js').con
const got = require('got');

const doQueryIn = (query) => new Promise((resolve, reject) => {
    database.query(query, (err, results) => {
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
                VALUES (${JSON.stringify(err)}, CURRENT_TIMESTAMP)
                `);

            reject(err);
        } else {
            resolve(results);
        }
    });
});

// check for banphrases with Pajbot API
exports.banphrasePass = (output, channel) => new Promise((resolve, reject) => {
    const channelParsed = channel.replace('#', '');

    const check = async (url) => {
        const bpCheck = await got(url, {
            method: "POST",
            body: "message=" + output,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
        }).json();

        return bpCheck;
    }

    if (channelParsed === "forsen") {
        const banphrasePass = check('https://forsen.tv/api/v1/banphrases/test');
        resolve(banphrasePass);
    }
    else if (channelParsed === "nymn") {
        const banphrasePass = check('https://nymn.pajbot.com/api/v1/banphrases/test');
        resolve(banphrasePass);
    }
    else if (channelParsed === "vadikus007") {
        const banphrasePass = check('https://vadikus007.botfactory.live/api/v1/banphrases/test');
        resolve(banphrasePass);
    }
    else if (channelParsed === "pajlada") {
        const banphrasePass = check('https://pajlada.pajbot.com/api/v1/banphrases/test');
        resolve(banphrasePass);
    }
    else if (channelParsed === "weest") {
        const banphrasePass = check('https://bot.weest.tv/api/v1/banphrases/test');
        resolve(banphrasePass);
    }
    else if (channelParsed === "smaczny") {
        const banphrasePass = check('https://smaczne.pajbot.com/api/v1/banphrases/test');
        resolve(banphrasePass);
    }
    else {
        // bp api for #haxk  https://haxk.botfactory.live/api/v1/banphrases/test
        resolve({banned: output});
    }
});

// check for user permissions with database
exports.checkPermissions = async (username) => {
    const checkPermissionList = await doQueryIn(`
        SELECT *
        FROM trusted_users
        WHERE username="${username}"
        `);
    if (checkPermissionList.length === 0 || checkPermissionList[0].status === "inactive") {
        return 0;
    }
    return checkPermissionList[0].permissions.split(':')[0];
}

// insert error to database if one occurs
exports.errorLog = async (err) => {
    console.log(err)
    const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
    const insert = [((err?.message ?? true) ? JSON.stringify(err) : err.message), new Date()];
    await doQueryIn(mysql.format(sql, insert));
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

// get rid of this in future
exports.capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// check if string contains number, replace this in future
exports.hasNumber = (myString) => {
    return /\d/.test(myString);
}

// get unicode code of given character
exports.escapeUnicode = (str) => {
    return str.replace(/[^\0-~]/g, function(ch) {
        return "\\u{" + ("000" + ch.charCodeAt().toString(16)).slice(-4) + '}';
    });
}

// get rid of this in future
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
        '#pajlada'
    ];
    const currentChannel = channels.filter(i => i === channel);
    if (!currentChannel.length) {
        return false
    }
    return true
}

exports.random = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
}

const search = require("youtube-search");
const creds = require('../credentials/config.js');
exports.youtube = async (url, results) => {
    const youtubeResults = await search(url, {
        maxResults: results,
        key: creds.youtube
    });
    return youtubeResults;
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

