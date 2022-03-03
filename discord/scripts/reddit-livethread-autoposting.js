const snoowrap = require('snoowrap');
const got = require("got");
const Discord = require('discord.js');

const kb = require('../../lib/handler.js').kb;
const config = require("../../lib/credentials/config.js");
const regex = require("../../lib/utils/regex.js");

const discord = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
discord.login(config.discord);

const r = new snoowrap({
    userAgent: 'linux:kunszgbot:2.0.0 (by /u/kunszg)',
    clientId: config.redditUID,
    clientSecret: config.redditSecret,
    username: config.redditUsername,
    password: config.redditPassword
})

setTimeout(async() => {
    const channel = discord.channels.cache.find(channel => channel.id === "874563973796757554");
    const thread = channel.threads.cache.find(thread => thread.id === "946288589136883713");

    const lastPost = [];

    setInterval(async () => {
        const post = await kb.query(`SELECT MIN(ID), data FROM livethreads WHERE resolved = "N"`);

        if (!post.length) {
            return;
        }

        const postData = JSON.parse(post[0].data);

        let tweetURL = postData.body.match(regex.url);
        let result = "";

        if (tweetURL) {
            tweetURL = tweetURL[0].split("?")[0];
            const urlParts = tweetURL.split("/");

            if (tweetURL.includes("twitter.com") && urlParts[4] === "status") {
                const tweetID = urlParts[urlParts.length - 1];

                const url = "https://api.twitter.com/2/tweets?ids=";
                const args = "&expansions=attachments.media_keys&media.fields=duration_ms,height,media_key,preview_image_url,public_metrics,type,url,width,alt_text"
                const tweetData = await got(url + tweetID + args, {
                    method: "GET",
                    headers: {
                        "authorization": `Bearer ${config.twitterBearer}`
                    },
                }).json();

                const fxTwitter = postData.body.replace(
                    tweetURL, tweetURL.replace("https://twitter.com", "https://fxtwitter.com")
                );

                if (tweetData.errors) {
                    result = "❗error resolving with Twitter API, posting the raw tweet:\n\n" + postData.body
                }
                else {
                    if (tweetData["includes"]) {
                        const media = tweetData["includes"].media[0];
                        if (media.type === "video") {
                            result = "video length - " + (media.duration_ms/1000).toFixed(1) +
                                "s\nview count - " + media.public_metrics.view_count + "\n\n" +
                                tweetData.data[0].text.replace(/https?.*?(?= |$)/g, "") + "\n" + fxTwitter
                        }
                        else {
                            result += postData.body
                        }
                    }
                    else {
                        result += postData.body
                    }
                }
            }
            else {
                result += postData.body
            }
        }
        else {
            result += postData.body
        }

        thread.send(result);

        await kb.query(`UPDATE livethreads SET resolved = "Y" WHERE ID = ?`, [post[0]["MIN(ID)"]]);
    }, 60000)

    const savePost = async(data) => {
        if (!lastPost.filter(cache => cache.id === data.id).length) {
            if (!data.body.includes("reddit.com")) {
                kb.query("INSERT INTO livethreads (data, date) VALUES (?, CURRENT_TIMESTAMP)", [JSON.stringify(data)]);
                lastPost.push(data);
            }
        }
    }

    r.getLivethread('18hnzysb1elcs').stream.on('update', await savePost);
}, 5000);