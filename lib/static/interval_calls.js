const creds = require('../credentials/config.js');
const custom = require('../utils/functions.js');
const fetch = require('node-fetch');
const got = require('got');

const sendOnlineStatusOnLaunch = async () => {
	await fetch(creds.supinic, {
		method: 'PUT',
	}).then(response => response.json())
}
setTimeout(() => { sendOnlineStatusOnLaunch() }, 5000);

const sendOnlineStatus = async () => {
	const test = await fetch(creds.supinic, {
		method: 'PUT',
	})
}
setInterval(() => { sendOnlineStatus() }, 295000);

const getTokenTwitch = async () => {
	const refreshToken = await custom.doQuery(`
		SELECT *
		FROM access_token
        WHERE platform="twitch"
		`);

	const token = (await fetch(`
        https://id.twitch.tv/oauth2/token?client_secret=${creds.client_secret}&grant_type=refresh_token&refresh_token=${refreshToken[0].refresh_token}`, {
			method: "POST",
			url: "https://id.twitch.tv/oauth2/token",
			headers: {
				"Client-ID": creds.client_id,
				"Content-Type": "application/x-www-form-urlencoded"
			},
	}).then(response => response.json()))

	await custom.doQuery(`
		UPDATE access_token
		SET access_token="${ token.access_token }"
        WHERE platform="twitch"
		`)
}
// update every 4h
getTokenTwitch()
setInterval(()=>{ getTokenTwitch() }, 14400000);

const getTokenSpotify = async () => {
    const userList = await custom.doQuery(`
        SELECT *
        FROM access_token
        WHERE platform="spotify"
        `);

    const users = userList.map(i => i.user)
    for (let i=0; i<users.length; i++) {
        const refreshToken = await custom.doQuery(`
            SELECT *
            FROM access_token
            WHERE platform="spotify" AND user="${users[i]}"
            `);

        const tokenSpotify = await fetch(`https://accounts.spotify.com/api/token?grant_type=refresh_token&refresh_token=${refreshToken[0].refresh_token}&client_secret=${creds.client_secret_spotify}&client_id=${creds.client_id_spotify}`, {
            method: "POST",
            url: `https://accounts.spotify.com/api/token`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
        }).then(response => response.json())

        const checkPremium = await fetch(`https://api.spotify.com/v1/me`, {
            method: "GET",
            url: `https://api.spotify.com/v1/me`,
            headers: {
                'Authorization': `Bearer ${refreshToken[0].access_token}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
        }).then(response => response.json())

        await custom.doQuery(`
            UPDATE access_token
            SET access_token="${tokenSpotify.access_token}",
                scopes="${tokenSpotify.scope}",
                premium="${(checkPremium.product === "open") ? "N" : "Y"}"
            WHERE platform="spotify" AND user="${users[i]}" AND user!="138403101"
            `);
    }
}
// update every 1h
getTokenSpotify()
setInterval(()=>{ getTokenSpotify() }, 3600000);

const updateCommits = async() => {
	// first page of API (get date of commit and sha)
	const commitData = await fetch('https://api.github.com/repos/KUNszg/kbot/commits?per_page=1')
        .then(response => response.json());

    if (commitData[0]?.commit ?? false) {
    	await custom.doQuery(`
    		UPDATE stats
    		SET date="${commitData[0].commit.committer.date}",
    			sha="${commitData[0].sha.slice(0, 7)}"
    		WHERE type="ping"
    		`);
    }
}
// update every 3h
updateCommits()
setInterval(()=>{updateCommits()}, 10800000);

const updateAllEmotes = async (channelName, ignore) => {
	const emotes = await custom.doQuery(`
		SELECT *
	 	FROM emotes
	 	WHERE channel="${channelName}"
	 	`);

    const userId = await custom.doQuery(`
        SELECT *
        FROM channels_logger
        WHERE channel="${channelName}"
        `);

	// get BTTV emotes from current channel
	let channelBTTVEmotes = await got(`https://decapi.me/bttv/emotes/${channelName}`);

	// get FFZ emotes form current channel
	let channelFFZEmotes = await got(`https://decapi.me/ffz/emotes/${channelName}`);

    const ffzEmoteLink = await fetch(`https://api.frankerfacez.com/v1/room/${channelName}`).json()

    const bttvEmoteLink = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${userId.id}`).json();

    if (ffzEmoteLink?.error ?? false) {
        return;
    }

    if (bttvEmoteLink?.message ?? false) {
        return
    }

    if (typeof channelBTTVEmotes.body === "undefined") {
        return;
    }

    if (typeof channelFFZEmotes.body === "undefined") {
        return;
    }

    if (!channelBTTVEmotes.body || !channelFFZEmotes.body) {
        return;
    }

	channelBTTVEmotes = String(channelBTTVEmotes.body).split(' ');
	channelFFZEmotes = String(channelFFZEmotes.body).split(' ');

	if (channelBTTVEmotes.join(' ').startsWith("Unable to retrieve") || channelFFZEmotes.join(' ').startsWith("Unable to retrieve")) {
		return;
	}

	const checkForRepeatedEmotes = async (emote, type) => {
		const updateEmotes = emotes.find(i => i.emote === emote);
		if (!updateEmotes) {
            if (type === "bttv") {
                const mergeArrays = bttvEmoteLink.channelEmotes.concat(bttvEmoteLink.sharedEmotes);
                const findEmote = mergeArrays.filter(i => i.code === emote);
                const emoteLink = `https://cdn.betterttv.net/emote/${findEmote[0].id}/1x`;

    			await custom.doQuery(`
    				INSERT INTO emotes (channel, emote, url, date, type)
    				VALUES ("${channelName}", "${emote}", "${emoteLink}", CURRENT_TIMESTAMP, "${type}")
    				`);
            }

            if (type === "ffz") {
                const getSetId = Object.keys(ffzEmoteLink.sets)[0];
                const findEmote = ffzEmoteLink.sets[getSetId].emoticons.filter(i => i.name === emote);

                await custom.doQuery(`
                    INSERT INTO emotes (channel, emote, url, date, type)
                    VALUES ("${channelName}", "${emote}", "${findEmote[0].urls["1"]}", CURRENT_TIMESTAMP, "${type}")
                    `);
            }
		}
	}

	channelBTTVEmotes.map(i => checkForRepeatedEmotes(i, 'bttv'));
	channelFFZEmotes.map(i => checkForRepeatedEmotes(i, 'ffz'));

	const allEmotes = channelBTTVEmotes.concat(channelFFZEmotes);
	const checkIfStillExists = emotes.filter(i => !allEmotes.includes(i.emote));

	if (!checkIfStillExists.length) {
		return;
	}

	for (let i=0; i<checkIfStillExists.length; i++) {
		await custom.doQuery(`
			DELETE FROM emotes
			WHERE channel="${channelName}" AND emote="${checkIfStillExists[i].emote}"
			`);

        await custom.doQuery(`
            INSERT INTO emotes_removed (channel, emote, date, type)
            VALUES ("${channelName}", "${checkIfStillExists[i].emote}", CURRENT_TIMESTAMP, "${checkIfStillExists[i].type}")
            `)
	}
	return;
}
setInterval(async() => {
	const channels = await custom.doQuery(`SELECT * FROM channels_logger`);
	const channelsArr = channels.map(i => i.channel);

	for (let i=0; i<channelsArr.length; i++) {
		setTimeout(() => {
			updateAllEmotes(channelsArr[i])
		}, i * 5000)
	}
}, 1800000); // 30m

setInterval(async () => {
	const partyData = await custom.doQuery(`
		SELECT *
		FROM party
		ORDER BY expires
		ASC
		`);

    const expires = Date.parse(partyData[0].expires);
    const diff = (Date.now() - expires)/1000;
    if (diff>=15) {
		await custom.doQuery(`
			DELETE FROM party WHERE ID="${partyData[0].ID}";
			`);
		return;
    }
}, 3000);