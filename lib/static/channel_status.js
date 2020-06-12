const creds = require('../credentials/config.js');
const custom = require('../utils/functions.js');
const fetch = require('node-fetch');

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
            .then(respo => respo.data?.filter(
                i => getChannels.map(i => i.channel).join('').replace(/,/g, ' ').includes(i.user_name.toLowerCase())
                ) ?? ""
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
    console.log(listOfChannels)

    function sleep(milliseconds) {
        const start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    }
    sleep(1000);

    if (listOfChannels.length === 0) {
        return;
    }

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