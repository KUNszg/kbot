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
                con.destroy();
            }
            console.log(err);
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

        let channels;

        this.sqlConnect();

        if (process.platform === "win32") {
            const owner = (await this.query(`SELECT * FROM trusted_users WHERE ID="75"`));
            channels = [owner[0].username];
        }
        else {
            if (type) {
                channels = await this.query("SELECT * FROM channels_logger");
            }
            else {
                channels = await this.query("SELECT * FROM channels");
            }
            channels = channels.map(i => i.channel);
        }

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
                this.emit("clearchat", "#" + channelName);
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
            this.emit("notice", "#" + msg.channelName, msg.messageID, msg.messageText);
        });

        // A change to a channel's followers mode, subscribers-only mode,
        // r9k mode, followers mode, slow mode etc.
        this.client.on("ROOMSTATE", (roomstateMessage) => {
            this.emit("roomstate", roomstateMessage);
        });

        // Subs, resubs, sub gifts, rituals, raids, etc. - See more
        // details about how to handle this message type below.
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

        this.client.on("WHISPER", (whisperMessage) => {
            this.emit("whisper", whisperMessage);
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
        this.client.whisper(username, message);
    }

    // set self color
    setColor(color) {
        this.client.setColor(color);
    }

    // get mods of the given channel
    getMods(channel) {
        return this.client.getMods(channel)
    }

    // get vips of the given channel
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
        } else {
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

module.exports = { IRC, SQL };

/* usernotice sub
UsernoticeMessage {
  rawSource: "@badge-info=subscriber/4;badges=subscriber/3,premium/1;color=#8A2BE2;display-name=Yusufdaboomboom;emotes=;flags=;id=02a05632-a412-412a-b407-9e5569dc5cfe;login=yusufdaboomboom;mod=0;msg-id=resub;msg-param-cumulative-months=4;msg-param-months=0;msg-param-multimonth-duration=0;msg-param-multimonth-tenure=0;msg-param-should-share-streak=1;msg-param-streak-months=4;msg-param-sub-plan-name=Channel\\sSubscription\\s(xqcow);msg-param-sub-plan=Prime;msg-param-was-gifted=false;room-id=71092938;subscriber=1;system-msg=Yusufdaboomboom\\ssubscribed\\swith\\sPrime.\\sThey've\\ssubscribed\\sfor\\s4\\smonths,\\scurrently\\son\\sa\\s4\\smonth\\sstreak!;tmi-sent-ts=1629841372130;user-id=217587481;user-type= :tmi.twitch.tv USERNOTICE #xqcow :PogU",
  ircPrefixRaw: 'tmi.twitch.tv',
  ircPrefix: {
    nickname: undefined,
    username: undefined,
    hostname: 'tmi.twitch.tv'
  },
  ircCommand: 'USERNOTICE',
  ircParameters: [ '#xqcow', 'PogU' ],
  ircTags: {
    'badge-info': 'subscriber/4',
    badges: 'subscriber/3,premium/1',
    color: '#8A2BE2',
    'display-name': 'Yusufdaboomboom',
    emotes: '',
    flags: '',
    id: '02a05632-a412-412a-b407-9e5569dc5cfe',
    login: 'yusufdaboomboom',
    mod: '0',
    'msg-id': 'resub',
    'msg-param-cumulative-months': '4',
    'msg-param-months': '0',
    'msg-param-multimonth-duration': '0',
    'msg-param-multimonth-tenure': '0',
    'msg-param-should-share-streak': '1',
    'msg-param-streak-months': '4',
    'msg-param-sub-plan-name': 'Channel Subscription (xqcow)',
    'msg-param-sub-plan': 'Prime',
    'msg-param-was-gifted': 'false',
    'room-id': '71092938',
    subscriber: '1',
    'system-msg': "Yusufdaboomboom subscribed with Prime. They've subscribed for 4 months, currently on a 4 month streak!",
    'tmi-sent-ts': '1629841372130',
    'user-id': '217587481',
    'user-type': ''
  },
  channelName: 'xqcow',
  messageText: 'PogU',
  channelID: '71092938',
  systemMessage: "Yusufdaboomboom subscribed with Prime. They've subscribed for 4 months, currently on a 4 month streak!",
  messageTypeID: 'resub',
  senderUsername: 'yusufdaboomboom',
  senderUserID: '217587481',
  badgeInfo: TwitchBadgesList(1) [
    TwitchBadge { name: 'subscriber', version: '4' }
  ],
  badgeInfoRaw: 'subscriber/4',
  badges: TwitchBadgesList(2) [
    TwitchBadge { name: 'subscriber', version: '3' },
    TwitchBadge { name: 'premium', version: '1' }
  ],
  badgesRaw: 'subscriber/3,premium/1',
  bits: undefined,
  bitsRaw: undefined,
  color: { r: 138, g: 43, b: 226 },
  colorRaw: '#8A2BE2',
  displayName: 'Yusufdaboomboom',
  emotes: [],
  flags: [],
  emotesRaw: '',
  flagsRaw: '',
  messageID: '02a05632-a412-412a-b407-9e5569dc5cfe',
  isMod: false,
  isModRaw: '0',
  serverTimestamp: 2021-08-24T21:42:52.130Z,
  serverTimestampRaw: '1629841372130',
  eventParams: {
    cumulativeMonths: 4,
    cumulativeMonthsRaw: '4',
    months: 0,
    monthsRaw: '0',
    multimonthDuration: '0',
    multimonthTenure: '0',
    shouldShareStreak: true,
    shouldShareStreakRaw: '1',
    streakMonths: 4,
    streakMonthsRaw: '4',
    subPlanName: 'Channel Subscription (xqcow)',
    subPlan: 'Prime',
    wasGifted: 'false'
  }
}*/