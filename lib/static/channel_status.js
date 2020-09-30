const creds = require('../credentials/config.js');
const custom = require('../utils/functions.js');
const got = require('got');

const checkLiveStatus = () => new Promise((resolve) => {
    (async () => {
        const getChannels = await custom.doQuery(`SELECT * FROM channels`);
        const parseForUrl = getChannels.map(i => `&user_login=${i.channel}`)

        const getAccessToken = await custom.doQuery(`
            SELECT *
            FROM access_token
            `);

        const getChannelData = got('https://api.twitch.tv/helix/streams' + parseForUrl.join('').replace('&', '?'), {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${getAccessToken[0].access_token}`,
                'Client-ID': creds.client_id,
                "Content-Type": "application/x-www-form-urlencoded"
            },
        }).json()
        resolve(getChannelData);
    })();
});

const checkStatusWithDatabase = () => new Promise((resolve) => {
    (async () => {
        const getChannels = await custom.doQuery(`SELECT * FROM channels`);

        const getChannelsLive = await checkLiveStatus()
            .then(respo => respo.data?.filter(
                i => getChannels.map(i => i.channel).join('').replace(/,/g, ' ').includes(i.user_name.toLowerCase())
                ) ?? ""
            )
        resolve(getChannelsLive)
    })();
})

const sendChannelStatus = async () => {
    const sendQuery = async (status, name) => {
        await custom.doQuery(`
            UPDATE channels
            SET status="${status}"
            WHERE channel="${name.toLowerCase()}" AND status="offline"
            `);
    }

    const sendQueryOffline = async (name) => {
        await custom.doQuery(`
            UPDATE channels
            SET status="offline"
            WHERE ${name.toString().replace(/,/g, ' AND ')}
            `);
    }

    let listOfChannels = []
    listOfChannels.push(await checkStatusWithDatabase());

    const sleep = (milliseconds) => {
        const start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    }
    sleep(1000);

    if (!listOfChannels.length) {
        return;
    }

    if (!listOfChannels[0].length) {
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
sendChannelStatus();
setInterval(()=>{
    sendChannelStatus()
}, 60000);