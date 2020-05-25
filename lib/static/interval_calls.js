const creds = require('../credentials/config.js');
const fetch = require('node-fetch');
const custom = require('../utils/functions.js');

const checkLiveStatus = (output) => new Promise(async(resolve, reject) => {
	const getChannels = await custom.doQuery(`SELECT * FROM channels`);
	const parseForUrl = getChannels.map(i => `&user_login=${i.channel}`)

	const getAccessToken = await custom.doQuery(`
		SELECT *
		FROM access_token
		`);

	const getChannelData = (fetch('https://api.twitch.tv/helix/streams' + parseForUrl.join('').replace('&', '?'), {
		method: "GET",
		url: "https://api.twitch.tv/helix/streams",
		headers: {
			'Authorization': `Bearer ${getAccessToken[0].access_token}`,
			'Client-ID': creds.client_id,
			"Content-Type": "application/x-www-form-urlencoded"
		},
	}).then(response => response.json()))
	resolve(getChannelData)
});

const checkStatusWithDatabase = (output) => new Promise(async(resolve, reject) => {
	async function test() {
		const getChannels = await custom.doQuery(`SELECT * FROM channels`);
		const getChannelsLive = await checkLiveStatus()
			.then(respo => respo.data.filter(
				i => getChannels.map(i=>i.channel).join('').replace(/,/g, ' ').includes(i.user_name.toLowerCase())
				)
			)
		resolve(getChannelsLive)
	}
	test()
})

async function sendChannelStatus() {
	async function sendQuery(status, name) {
		await custom.doQuery(`
			UPDATE channels
			SET status="${status}"
			WHERE channel="${name.toLowerCase()}" AND status="offline"
			`);
	}

	async function sendQueryOffline(name) {
		await custom.doQuery(`
			UPDATE channels
			SET status="offline"
			WHERE ${name.toString().replace(/,/g, ' AND ')}
			`);
	}

	let listOfChannels = []
	listOfChannels.push(await checkStatusWithDatabase())

	function sleep(milliseconds) {
		const start = new Date().getTime();
		for (var i = 0; i < 1e7; i++) {
			if ((new Date().getTime() - start) > milliseconds) {
				break;
			}
		}
	}
	sleep(1000);

	if (listOfChannels[0].length === 0) {
		await custom.doQuery(`
			UPDATE channels
			SET status="offline"
			`);
		return;
	}

	listOfChannels.forEach((element) => {
		element.forEach(i => sendQuery(i.type, i.user_name));
		sendQueryOffline(element.map(i => `channel!="${i.user_name.toLowerCase()}"`))
	})
	listOfChannels = [];
}
sendChannelStatus()
setInterval(()=>{ sendChannelStatus() }, 60000)

async function sendOnlineStatusOnLaunc() {
	await fetch(creds.supinic, {
		method: 'PUT',
	}).then(response => response.json())
}
setTimeout(() => { sendOnlineStatusOnLaunc() }, 5000);

async function sendOnlineStatus() {
	const test = (await fetch(creds.supinic, {
		method: 'PUT',
	}))
}
setInterval(() => { sendOnlineStatus() }, 295000);

async function getToken() {

	const refreshToken = await custom.doQuery(`
		SELECT *
		FROM access_token
		`);

	const token = (await fetch(`https://id.twitch.tv/oauth2/token?client_secret=${creds.client_secret}&grant_type=refresh_token&refresh_token=${refreshToken[0].refresh_token}`, {
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
			refresh_token="${ token.refresh_token }",
			scopes="${ token.scope.join(' ') }"
		`)
}

// update every 4h
getToken()
setInterval(()=>{ getToken() }, 14400000);

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
	const commitCount = "https://api.github.com/repos/KUNszg/kbot/commits?per_page=100&page=9";
	const commit = await fetch(commitCount)
		.then(response => response.json());

	// first page of API (get date of commit and sha)
	const commitData = await fetch('https://api.github.com/repos/KUNszg/kbot/commits?per_page=100')
		.then(response => response.json());

	const countCommits = commit.length + 900
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