#!/usr/bin/env node
'use strict';

const mysql = require('mysql2');
const con = require('./connection.js');
const regex = require('./regex.js');
const utils = require('./utils.js');
const got = require('got');

const db = new con.IRC();

db.sqlConnect();

exports.doQuery = (query) => new Promise((resolve, reject) => {
    resolve(db.queryAlt(mysql.format(query)));
});

exports.query = (query, data = []) => new Promise((resolve, reject) => {
    resolve(db.query(mysql.format(query, data)));

    db.unprepare(query);
});

// check for banphrases
exports.banphrasePass = (output, channel) => new Promise(async (resolve, reject) => {
    channel = channel.replace('#', '');

    const data = await db.query(`
        SELECT *
        FROM channel_banphrase_apis
        WHERE channel=? AND status="enabled"`,
        [channel]);

    if (!data.length) {
        resolve({banned: false});
        return;
    }

    const banphrase = await got(data[0].url, {
            method: "POST",
            body: "message=" + output,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
        }).json();

    resolve(banphrase);
});

// check for user permissions with database
exports.checkPermissions = async (username) => {
    const checkPermissionList = await db.query(`
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
    await db.query(`
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
            '#nymn',
            '#kattah'
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

// ignore so channel doesnt get checked for banphrase etc but still gets marked as strict
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
            return "[info resp 100 Continue] - the server has received the request headers " +
            "and the client should proceed to send the request body (POST request).";

        case "101":
            return "[info resp 101 Switching Protocols] - the requester has asked the server " +
            "to switch protocols and the server has agreed to do so.";

        case "102":
            return "[info resp 102 Processing] - a WebDAV request may contain many sub-requests " +
            "involving file operations, requiring a long time to complete the request.";

        case "103":
            return "[info resp 103 Early Hints] - returning response headers before final HTTP message."

        // 2xx success
        case "200":
            return "[success 200 OK] - successful HTTP response.";

        case "201":
            return "[success 200 Created] - the request has been fulfilled, resulting in the creation of a new resource.";

        case "202":
            return "[success 202 Accepted] - the request has been accepted for processing, but the processing has not been completed. ";

        case "203":
            return "[success 203 Non-Authoritative Information] - returning midified version of the origin's response.";

        case "204":
            return "[success 204 No Content] - the server successfully processed the request, and is not returning any content.";

        case "205":
            return "[success 205 Reset Content] - the server successfully processed the request, asks that the requester " +
            "reset its document view, and is not returning any content.";

        case "206":
            return "[success 206 Partial Content] - the server is delivering only part of the resource (byte serving) " +
            "due to a range header sent by the client. ";

        case "207":
            return "[success 207 Multi-Status] - the message body that follows is by default an XML message and can " +
            "contain a number of separate response codes.";

        case "208":
            return "[success 208 Already Reported] - the members of a DAV binding have already been enumerated in a preceding " +
            "part of the (multistatus) response, and are not being included again.";

        case "226":
            return "[success 226 IM Used] - the server has fulfilled a request for the resource, and the response is a " +
            "representation of the result of one or more instance-manipulations applied to the current instance.";

        // 3xx redirection
        case "300":
            return "[redirection 300 Multiple Choices] - indicates multiple options for the resource from which the client may choose";

        case "301":
            return "[redirection 301 Moved Permanently] - this and all future requests should be directed to the given URI.";

        case "302":
            return "[redirection 302 Found] - look at (browse to) another URL.";

        case "303":
            return "[redirection 303 See Other] - the response to the request can be found under another URI using the GET method.";

        case "304":
            return "[redirection 304 Not Modified] - resource has not been modified since the version specified by the " +
            "request headers If-Modified-Since or If-None-Match";

        case "305":
            return "[redirection 305 Use Proxy] - the requested resource is available only through a proxy.";

        case "307":
            return "[redirection 307 Temporary Redirect] - the request should be repeated with another URI; " +
            " however, future requests should still use the original URI";

        case "308":
            return "[redirection 308 Permanent Redirect] - the request and all future requests should be repeated using another URI.";

        // 4xx client errors
        case "400":
            return "[client err 400 Bad Request] - the server could not understand the request due to invalid syntax.";

        case "401":
            return "[client err 401 Unauthorized] - I am not authorized to resolve this request.";

        case "403":
            return "[client err 403 Forbidden] - the server understood the request, but is refusing to fulfill it.";

        case "404":
            return "[client err 404 Not Found] - requested resource could not be found.";

        case "405":
            return "[client err 405 Method Not Allowed] - a request method is not supported for the requested resource.";

        case "406":
            return "[client err 406 Not Acceptable] - the requested resource is capable of generating only content " +
            "not acceptable according to the Accept headers sent in the request.";

        case "407":
            return "[client err 407 Proxy Authentication Required] - The client must first authenticate itself with the proxy.";

        case "408":
            return "[client err 408 Request Timeout] - the server timed out waiting for the request.";

        case "409":
            return "[client err 409 Conflict] - request could not be processed because of conflict in the current state of the resource";

        case "410":
            return "[client err 410 Gone] - resource requested is no longer available and will not be available again";

        case "411":
            return "[client err 411 Length Required] - the request did not specify the length of its content, " +
            "which is required by the requested resource.";

        case "412":
            return "[client err 412 Precondition Failed] - the server does not meet one of the preconditions that " +
            "the requester put on the request header fields.";

        case "413":
            return "[client err 413 Payload Too Large] - the request is larger than the server is willing or able to process.";

        case "414":
            return "[client err 414 URI Too Long] - the URI provided was too long for the server to process.";

        case "415":
            return "[client err 415 Unsupported Media Type] - the request entity has a media type which the " +
            "server or resource does not support. ";

        case "416":
            return "[client err 416 Range Not Satisfable] - The client has asked for a portion of the " +
            "file (byte serving), but the server cannot supply that portion.";

        case "417":
            return "[client err 417 Expectation Failed] - the server cannot meet the requirements of the Expect request-header field.";

        case "418":
            return "[client err 418 I'm a teapot] - Okayga 🍵";

        case "421":
            return "[client err 421 Misdirected Request] - the request was directed at a server that is not able to produce a response.";

        case "422":
            return "[client err 422 Unprocessable Entity] - the request was well-formed but was unable to be followed due to semantic errors.";

        case "423":
            return "[client err 423 Locked] - the resource that is being accessed is locked.";

        case "424":
            return "[client err 424 Failed Dependency] - the request failed because it depended on another request and that request failed.";

        case "425":
            return "[client err 425 Too Early] - the server is unwilling to risk processing a request that might be replayed.";

        case "426":
            return "[client err 426 Upgrade Required] - the client should switch to a different protocol such as TLS/1.3, " +
            "given in the Upgrade header field.";

        case "428":
            return "[client err 428 Precondition Required] - the origin server requires the request to be conditional. ";

        case "429":
            return "[client err 429 Too Many Requests] - sending too many queries at once, rate limiting has been applied.";

        case "431":
            return "[client err 431 Request Header Fields Too Large] - the server is unwilling to process the request because either " +
            "an individual header field, or all the header fields collectively, are too large.";

        case "444":
            return "[nginx client err 444 No Response] - server will return no information to client";

        case "451":
            return "[client err 451 Unavailable For Legal Reasons] - A server operator has received a legal demand to deny access " +
            "to a resource or to a set of resources that includes the requested resource.";

        case "494":
            return "[nginx client err 494 Request header too large] - too large request or too long header line.";

        case "495":
            return "[nginx client err 495 SSL Certificate Error] - the client has provided an invalid client certificate.";

        case "496":
            return "[nginx client err 496 SSL Certificate Required] - client certificate is required but not provided.";

        case "497":
            return "[nginx client err 497 HTTP Request Sent to HTTPS Port] - the client has made a HTTP request to a port " +
            "listening for HTTPS requests.";

        case "499":
            return "[nginx client err 499 Client Closed Request] - the client has closed the request before the server could send a response.";

        // 5xx server errors
        case "500":
            return "[server err 500 Internal Server Error]";

        case "501":
            return "[server err 501 Not implemented] - the server either does not recognize the request method, or " +
            "it lacks the ability to fulfil the request.";

        case "502":
            return "[server err 502 Bad Gateway] - the server was acting as a gateway or proxy and received an invalid " +
            "response from the upstream server.";

        case "503":
            return "[server err 503 Service Unavailable] - the server is currently unable to handle the request due to a temporary condition.";

        case "504":
            return "[server err 504 Gateway Timeout] - the server cannot handle the request due to overload/maintenance.";

        case "505":
            return "[server err 505 HTTP Version Not Supported] - the server does not support the HTTP protocol version used in the request.";

        case "506":
            return "[server err 506 Variant Also Negotiates] - transparent content negotiation for the request results in a circular reference.";

        case "507":
            return "[server err 507 Insufficient Storage] - the server is unable to store the representation needed to complete the request.";

        case "508":
            return "[server err 508 Loop Detected] - the server detected an infinite loop while processing the request";

        case "510":
            return "[server err 510 Not Exteneded] - further extensions to the request are required for the server to fulfil it.";

        case "511":
            return "[server err 511 Network Authentication Required] - the client needs to authenticate to gain network access.";

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
        let cooldown = await db.query(`
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
                return sub(0.5);

            case 3:
                return sub(0.65);

            case 4:
                return sub(0.75);

            case 5:
                return sub(0.9);

            default:
                return cooldown;
        }
    }

    // command cooldown
    async setCooldown() {
        const owner = await utils.Get.user().owner();
        if (this.userId === owner[0].userId && this.platform != "discord") { return [] };

        if (talkedRecently.has(this.key)) { return [this.key]; }

        talkedRecently.add(this.key);

        setTimeout(() => {
            talkedRecently.delete(this.key);
        }, await this.cooldownReduction());
        return [];
    }

    // cooldown between command uses
    async setGlobalCooldown() {
        const owner = await utils.Get.user().owner();
        if (this.userId === owner[0].userId && this.platform != "discord") { return [] };

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
            return db.query(`
                SELECT *
                FROM user_list
                WHERE userId=?`, [userstate['user-id']]);
        }
        return Object.create(this.userData)
    },

    userData: {
        byUsername: function (username) {
            return db.query(`
                SELECT *
                FROM user_list
                WHERE username=?`, [username]);
        },

        byId: function (userId) {
            return db.query(`
                SELECT *
                FROM user_list
                WHERE userId=?`, [userId]);
        },

        owner: function (ID) {
            return db.query(`
                SELECT *
                FROM trusted_users
                WHERE ID="75"`);
        },

        banned: function (userstate) {
            return db.query(`
                SELECT *
                FROM ban_list
                WHERE user_id=?`,
                [userstate['user-id']]);
        },

        optout: function (command, user, column) {
            return db.query(`
                SELECT *
                FROM optout
                WHERE command=? AND ${column}=?`,
                [command, user]);
        }
    },

    channel(channelName) {
        if (channelName) {
            return db.query(`
                SELECT *
                FROM channels
                WHERE channel=?`,
                [channelName.replace('#', '')]);
        }
        return Object.create(this.channelData)
    },

    channelData: {
        isStrictAndLive: async function (channelName) {
            this.data = await db.query(`
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
        db.query(`
            INSERT INTO executions (username, command, result, channel, date)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [user['username'], input.join(' '), this._result, channel.replace('#', '')]);
    }
}

exports.Swapper = class Swapper {
    constructor(html, repl) {
        this.html = html;
        this.value = repl[0];
        this.valueKeys = Object.keys(repl[0]).map(i => `%{${i}}`);
    }

    template() {
        for (let i = 0; i < this.valueKeys.length; i++) {
            this.html = this.html.replace(
                this.valueKeys[i], this.value[this.valueKeys[i].replace(/^%{/, '').replace(/}$/, '')]
                );
        }
        return this.html;
    }
}

exports.conLog = async (req, route = "API") => {
    await db.query(`
        INSERT INTO web_connections (url, method, protocol, route, userAgent, date)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [req.originalUrl, req.method, req.protocol, route, req.headers["user-agent"]]);
}

const WebSocket = require('ws');

exports.WSocket = class WSocket {
    constructor(path, json = false) {
        this.json = json;
        this.path = path.startsWith("/") ? path : "/" + path;
    }

    emit(message) {
        const port = (this.path === "/wsl") ? 3001 : 3000;

        const ws = new WebSocket(`ws://localhost:${port}${this.path}`);

        ws.on('open', function open() {
            if (this.json) {
                ws.send(message);
            }
            else {
                ws.send(JSON.stringify(message))
            }
            ws.close();
        });
    }
}

exports.ModifyOutput = class ModifyOutput {
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

// handling the twitch connection/messages
const { ChatClient } = require("dank-twitch-irc");
const EventEmitter = require("events");

let lastMessage = {};

exports.IRC = class IRC extends EventEmitter {
    constructor(options) {
        if (!options) {
            options = {
                username: "ksyncbot",
                password: creds.oauth,
                ignoreUnhandledPromiseRejections: true
            }
        }
        super();

        this.client = new ChatClient(options);
    }

    async connect(isLogger) {
        this.client.connect();

        let channels;

        if (isLogger) {
            channels  = await db.query("SELECT * FROM channels_logger");
        }
        else {
            channels  = await db.query("SELECT * FROM channels");
        }

        channels = channels.map(i => i.channel);

        this.client.joinAll(channels);

        this.client.on("PRIVMSG", (msg) => {
            this.emit("message", `#${msg.channelName}`, msg, msg.messageText);
        });

        this.client.on("ready", () => {
            this.emit("ready", true);
        });

        this.client.on("close", (error) => {
            this.emit("close", error);
        });
    }

    messageCache(channel, message, timestamp) {
        lastMessage.channel = channel;
        lastMessage.message = message;
        lastMessage.timestamp = timestamp;
    }

    say(channel, message) {
        channel = channel[0] === "#" ? channel : `#${channel}`;

        if (typeof message != "string") {
            message = JSON.stringify(message);
        }

        // split the message in separate chunks if it exceeds 500 characters
        if (message.length > 500) {
            function* chunks(arr, n) {
                for (let i = 0; i < arr.length; i += n) {
                    yield arr.slice(i, i + n);
                }
            }

            const _message = [...chunks(message.split(""), 500)];

            for (let i = 0; i < _message.length; i++) {
                if (lastMessage.message === _message[i].join("") && lastMessage.channel === channel) {
                    _message[i] += "\u{E0000}";
                }

                if (i > 3) {
                    this.client.say(channel, "Response too long (1500+ characters)");
                    return;
                }

                this.client.say(channel, _message[i].join(""));

                this.messageCache(channel, _message[i].join(""), Date.now());
            }
        }
        else {
            if (lastMessage.message) {
                if (lastMessage.message === message && lastMessage.channel === channel) {
                    message += "\u2800";
                }
            }

            if (lastMessage.timestamp) {
                const timestamp = 4500 - (Date.now() - lastMessage.timestamp);

                if (timestamp < 4500 && timestamp > 0) {
                    global.client = this.client;
                    global.messageCache = this.messageCache;

                    setTimeout(() => {
                        global.client.say(channel, message);
                        global.messageCache(channel, message, Date.now())
                    }, timestamp);

                    return;
                }
            }
            this.client.say(channel, message);
            this.messageCache(channel, message, Date.now());
        }
    }
}
