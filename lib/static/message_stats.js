#!/usr/bin/env node
'use strict';

const bot = require('../handler.js');

const cache = [];
bot.kb.on("chat", async (channel, user, message, self) => {

	const channelParsed = channel.replace('#', '');
	cache.push({
		'channel': channelParsed,
		'user': user['username'],
		'message': message
	})
	setInterval(()=>{cache.shift()}, 60000);
});

module.exports = { cache }
