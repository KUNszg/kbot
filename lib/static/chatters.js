const got = require('got');
const utils = require('../utils/utils.js');

const chatterList = [];

const getUsers = async() => {
	let channelList = await utils.query(`SELECT * FROM channels`);

	const listUsers = async(channelName) => {
		let activeChatters = await got(`https://tmi.twitch.tv/group/user/${channelName}/chatters`).json();
		activeChatters = activeChatters.chatters
		activeChatters = activeChatters.viewers.concat(activeChatters.moderators, activeChatters.vips, activeChatters.broadcaster);

		chatterList.push({[channelName] : activeChatters})
	}

	channelList = channelList.map(i => i.channel);
	for (let i=0; i<channelList.length; i++) {
		setTimeout(() => {
			listUsers(channelList[i])
		}, i * 3000)
	}
}
getUsers()
setInterval(() => {
	chatterList.length = 0; getUsers();
}, 25200000)

module.exports = {chatters: chatterList}