const creds = require('../credentials/config.js');
const custom = require('../utils/functions.js');
const fetch = require('node-fetch');

async function sendOnlineStatusOnLaunch() {
	await fetch(creds.supinic, {
		method: 'PUT',
	}).then(response => response.json())
}
setTimeout(() => { sendOnlineStatusOnLaunch() }, 5000);

async function sendOnlineStatus() {
	const test = (await fetch(creds.supinic, {
		method: 'PUT',
	}))
}
setInterval(() => { sendOnlineStatus() }, 295000);

async function getTokenTwitch() {

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
		SET access_token="${ token.access_token }",
			scopes="${ token.scope.join(' ') }"
        WHERE platform="twitch"
		`)
}
// update every 4h
getTokenTwitch()
setInterval(()=>{ getTokenTwitch() }, 14400000);

async function getTokenSpotify() {

    const refreshToken = await custom.doQuery(`
        SELECT *
        FROM access_token
        WHERE platform="spotify"
        `);

    const token2 = (await fetch(`https://accounts.spotify.com/api/token?grant_type=refresh_token&refresh_token=${refreshToken[0].refresh_token}&client_secret=${creds.client_secret_spotify}&client_id=${creds.client_id_spotify}`, {
        method: "POST",
        url: `https://accounts.spotify.com/api/token`,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
    }).then(response => response.json()))

    await custom.doQuery(`
        UPDATE access_token
        SET access_token="${ token2.access_token }",
            scopes="${ token2.scope }"
        WHERE platform="spotify"
        `)
}
// update every 1h
getTokenSpotify()
setInterval(()=>{ getTokenSpotify() }, 3600000);

async function updateStats() {
	const channelValue = await custom.doQuery(`
		SELECT COUNT(*) AS valueCount
		FROM logs_nymn
		WHERE message LIKE "%nigg%"
		`);
	await custom.doQuery(`
		UPDATE stats
		SET count="${channelValue[0].valueCount}"
		WHERE channel="nymn"
		`);
	const channelValue2 = await custom.doQuery(`
		SELECT COUNT(*) AS valueCount
		FROM logs_forsen
		WHERE message LIKE "%nigg%"
		`);
	await custom.doQuery(`
		UPDATE stats
		SET count="${channelValue2[0].valueCount}"
		WHERE channel="forsen"
		`);
}
// update every 2h
setInterval(()=>{updateStats()}, 7200000);

async function updateCommits() {
	// count commits (from last page)
	const commitCount = "https://api.github.com/repos/KUNszg/kbot/commits?per_page=100&page=10";
	const commit = await fetch(commitCount)
		.then(response => response.json());

	// first page of API (get date of commit and sha)
	const commitData = await fetch('https://api.github.com/repos/KUNszg/kbot/commits?per_page=100')
		.then(response => response.json());

	const countCommits = commit.length + 1000
	const updateCommits = await custom.doQuery(`
		UPDATE stats
		SET count="${countCommits}",
			date="${commitData[0].commit.committer.date}",
			sha="${commitData[0].sha.slice(0, 7)}"
		WHERE type="ping"
		`);
}
// update every 3h
setInterval(()=>{updateCommits()}, 10800000);