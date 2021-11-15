const EventEmitter = require("events");
const mysql = require("mysql2");

const creds = require("../credentials/config.js");

// handling the MySQL connection
class SQL extends EventEmitter {
    constructor(auth) {
        if (!auth) {
            auth = {
                host: creds.db_host,
                user: creds.db_server_user,
                password: creds.db_pass,
                database: creds.db_name
            }
        }
        super();

        this.auth = auth;
    }

    sqlConnect() {
        this.con = mysql.createConnection(this.auth);

        this.con.on('error', (err) => {
            if (err.fatal) {
                this.con.destroy();
            }
            else {
                console.log(err);
            }
        });
    }

    async query(query, data = []) {
        try {
            const result = (await this.con.promise().execute(mysql.format(query, data)))[0];
            this.con.unprepare(query);
            return result;
        }
        catch (err) {
            console.log(err)
        }
    }

    async queryAlt(query) {
        try {
            const result = (await this.con.promise().query(mysql.format(query)))[0];
            this.con.unprepare(query);
            return  result;
        }
        catch (err) {
            console.log(err)
        }
    }

    unprepare(query) {
        this.con.unprepare(query);
    }
}

// handling the twitch connection/messages
const { ChatClient } = require("dank-twitch-irc");

let lastMessage = {};

class IRC extends SQL {
    constructor(options) {
        if (!options) {
            options = {
                username: "ksyncbot",
                password: creds.oauth,
                ignoreUnhandledPromiseRejections: true,
                rateLimits: "verifiedBot"
            }
        }
        super();

        this.client = new ChatClient(options);
    }

    async tmiConnect(type) {
        this.client.connect();
        this.sqlConnect();

        let channels;

        /*
        if (process.platform === "win32") {
            const owner = (await this.query(`SELECT * FROM trusted_users WHERE ID="75"`));
            channels = [owner[0].username];
        }
        else {
        */
            if (type) {
                channels = await this.query("SELECT * FROM channels_logger");
            }
            else {
                channels = await this.query("SELECT * FROM channels");
            }
            channels = channels.map(i => i.channel);
       // }

        this.client.joinAll(channels).catch(err => {});

        // Called on incoming messages whose command is PRIVMSG.
        // The message parameter is always instanceof PrivmsgMessage.
        this.client.on("PRIVMSG", (msg) => {
            const oldFormat = {
                "color": msg.colorRaw,
                "username": msg.senderUsername,
                "message-type": "chat"
            }

            delete msg.color;

            msg = {...msg.ircTags, ...oldFormat, ...msg};

            delete msg.ircTags;

            const self = msg["user-id"] === "229225576";

            if (msg.ircParameters[1].split(" ")[0].includes("ACTION")) {
                this.emit("action", `#${msg.channelName}`, msg, msg.messageText, self);
            }
            else {
                this.emit("message", `#${msg.channelName}`, msg, msg.messageText, self);
            }
        });

        // Called when the client is terminated as a whole. Not called for individual
        // connections that were disconnected. Can be caused for example by a invalid
        // OAuth token (failure to login), or when client.close() or client.destroy()
        // was called. error is only non-null if the client was closed by a call to client.close().
        this.client.on("close", (error) => {
            this.emit("close", error);
        });

        // Called when the client becomes ready for the first time (login to the chat server is successful.)
        this.client.on("ready", () => {
            this.emit("connected", true);
        });

        // Called when any command is executed by the client.
        this.client.on("rawCommand", (cmd) => {
            this.emit("rawCommand", cmd);
        });

        // Timeout and ban messages
        this.client.on("CLEARCHAT", (msg) => {
            if (msg.targetUsername) {
                this.emit("timeout", "#" + msg.channelName, msg.targetUsername, "timeout", msg.banDuration, msg);
            }
            else {
                this.emit("clearchat", "#" + msg.channelName);
            }
        });

        // Single message deletions (initiated by /delete)
        this.client.on("CLEARMSG", (clearmsgMessage) => {
            this.emit("clearmsg", clearmsgMessage);
        });

        // A channel entering or exiting host mode.
        this.client.on("HOSTTARGET", (hosttargetMessage) => {
            this.emit("host", hosttargetMessage);
        });

        // Various notices, such as when you /help, a command fails,
        // the error response when you are timed out, etc.
        this.client.on("NOTICE", (msg) => {
            this.emit("notice", "#" + msg.channelName, msg.messageID, msg?.messageText ?? "");
        });

        // A change to a channel's followers mode, subscribers-only mode,
        // r9k mode, followers mode, slow mode etc.
        this.client.on("ROOMSTATE", (roomstateMessage) => {
            this.emit("roomstate", roomstateMessage);
        });

        // Subs, resubs, sub gifts, rituals, raids, etc.
        this.client.on("USERNOTICE", (usernoticeMessage) => {
            this.emit("usernotice", usernoticeMessage);
        });

        // Your own state (e.g. badges, color, display name, emote
        // sets, mod status), sent on every time you join a channel or
        // send a PRIVMSG to a channel
        this.client.on("USERSTATE", (userstateMessage) => {
            this.emit("userstate", userstateMessage);
        });

        // Logged in user's "global state", sent once on every login
        // (Note that due to the used connection pool you can receive
        // this multiple times during your bot's runtime)
        this.client.on("GLOBALUSERSTATE", (globaluserstateMessage) => {
            this.emit("globaluserstate", globaluserstateMessage);
        });

        this.client.on("WHISPER", (msg) => {
            const oldFormat = {
                "color": msg.colorRaw,
                "username": msg.senderUsername,
                "message-type": "chat"
            }

            delete msg.color;

            msg = {...msg.ircTags, ...oldFormat, ...msg};

            delete msg.ircTags;

            const username = msg.senderUsername;
            const message = msg.messageText;
            const self = msg["user-id"] === "229225576";

            this.emit("whisper", username, msg, message, self);
        });

        this.client.on("JOIN", (joinMessage) => {
            this.emit("join", joinMessage);
        });

        this.client.on("PART", (partMessage) => {
            this.emit("part", partMessage);
        });

        this.client.on("CAP", (capMessage) => {
            this.emit("cap", capMessage);
        });
    }

    messageCache(channel, message, timestamp) {
        lastMessage.channel = channel;
        lastMessage.message = message;
        lastMessage.timestamp = timestamp;
    }

    // join the channel (only for session)
    join(channel) {
        channel = channel.startsWith("#") ? channel : `#${channel}`;

        this.client.join(channel);
    }

    // leave the channel (only for session)
    part(channel) {
        channel = channel.startsWith("#") ? channel : `#${channel}`;

        this.client.part(channel);
    }

    // Post a /me message in the given channel.
    action(channel, message) {
        channel = channel.startsWith("#") ? channel : `#${channel}`;

        this.client.me(channel, message);
    }

    // timeout a user
    timeout(channel, username, length, reason = "") {
        this.client.timeout(channel.replace("#", ""), username, length, reason);
    }

    // ban a user
    ban(channel, username, reason = "") {
        this.client.ban(channel.replace("#", ""), username, reason);
    }

    // whisper user with message
    whisper(username, message) {
        message = message.replace(/(\r\n|\n|\r)/gm, "");
        this.client.whisper(username, message);
        this.query(`
            INSERT INTO whispers_sent (username, message, date)
            VALUES (?, ?, CURRENT_TIMESTAMP)`,
            [username, message]);
    }

    // set self color
    setColor(color) {
        this.client.setColor(color);
    }

    // get mods of the channel
    getMods(channel) {
        return this.client.getMods(channel)
    }

    // get vips of the channel
    getVips(channel) {
        return this.client.getVips(channel)
    }

    // send ping to tmi
    ping() {
        return this.client.ping();
    }

    // Send a raw PRIVMSG to the given channel. You can issue chat commands with
    // this function, e.g. client.privmsg("forsen", "/timeout weeb123 5") or normal
    // messages, e.g. client.privmsg("forsen", "Kappa Keepo PogChamp").
    sayRaw(channel, message) {
        this.client.privmsg(channel, message);
    }

    say(channel, message) {
        channel = channel[0] === "#" ? channel : `#${channel}`;

        message = message.replace(/\n|\r/g, "");

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

/*const redis = require("redis");

const Redis = {
    connect() {
        this.client = redis.createClient();

        this.client.on("error", function(error) {
            console.error(error);
        });
    },

    async get(key) {
        const result = await new Promise((resolve, reject) => {
            this.client.get(key, function (err, res) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            })
        });
        return result;
    },

    set(key, data = 0) {
        this.client.set(key, JSON.stringify(data));
    },

    init(...keys) {
        keys.map(i => this.set(i, []));
    },

    arrayClear(key) {
        this.set(key, []);
    },

    async append(key, data) {
        let entry = JSON.parse(await this.get(key));
        if (Array.isArray(data)) {
            entry.push(...data);
        }
        else {
            entry.push(data);
        }
        this.set(key, entry);
    },

    del(key) {
      this.client.del(key);
    },

    async size() {
        const result = await new Promise((resolve, reject) => {
            this.client.send_command("dbsize", function (err, res) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            })
        });
        return result;
    }
}*/

module.exports = { IRC, SQL, } //Redis };