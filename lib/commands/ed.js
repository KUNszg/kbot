#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const fetch = require('node-fetch');
const bot = require('../handler.js')

module.exports = {
	name: prefix + 'ed',
	aliases: null,
	description: `kb ed [register/unregister/silence/force] | register - register in the database | 
	unregister - unregister from the database | silence - mute the feedback | force - force your reminder trigger -- cooldown 10s`,
	permission: 0,
	cooldown: 10000,
	invocation: async (channel, user, message, args) => {
		try {

			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(2);

			const getUserAlias = await custom.doQuery(`
				SELECT * 
				FROM user_list
				WHERE userId="${user['user-id']}"
				`);

			const resultsRegister = await custom.doQuery(`
				SELECT username 
				FROM ed 
				WHERE user_alias="${getUserAlias[0].ID}"
				`);

			switch (msg[0]) {

				case 'module':
					if (await custom.checkPermissions(user['username'])<3) { 
						return '';
					}
					await custom.doQuery(`
						UPDATE cookieModule 
						SET reminders="${msg[1]}" 
						WHERE type="ed"
						`);

					return `updated "ed" module status to ${msg[1]}`;

				case 'force':
					function sleep(milliseconds) {
						const start = new Date().getTime();
						for (var i = 0; i < 1e7; i++) {
							if ((new Date().getTime() - start) > milliseconds) {
								break;
							}
						}
					}
					sleep(1000)
					const edApi = await fetch(`https://huwobot.me/api/user?id=${user['user-id']}`)
						.then(response => response.json());

					const regCheck = await custom.doQuery(`
						SELECT * 
						FROM ed_reminders 
						WHERE user_alias="${getUserAlias[0].ID}"
						`);

					const now = new Date();

					// check if user is registered
					if (regCheck.length === 0) {
						return `${user['username']}, you are not registered in the database, 
						use "kb ed register" to do so.`;
					}

					if ((Date.now(new Date())/1000) - edApi.next_entry.toFixed(0) >= 0) {
						return `${user['username']}, you can enter the dungeon right now! (+ed)`;
					}

					Date.prototype.addMinutes = function(minutes) {
						const copiedDate = new Date(this.getTime());
						return new Date(copiedDate.getTime() + minutes * 1000);
					}

					async function updateReminder(time) {

						await custom.doQuery(`
							UPDATE ed_reminders 
							SET channel="${channel.replace('#', '')}", 
								fires="${now.addMinutes(time).toISOString().slice(0, 19).replace('T', ' ')}", 
								status="scheduled"
							WHERE user_alias="${getUserAlias[0].ID}"
							`);
					}

					const asd = edApi.next_entry.toFixed(0) - (Date.now(new Date())/1000)
					updateReminder(asd)

					bot.kb.whisper(user['username'], `I will remind you to enter dungeon in 
						${custom.formatUptime(edApi.next_entry.toFixed(0) - (Date.now(new Date())/1000))} (forced reminder)`);
					break;

				case 'register':
					
					if (resultsRegister.length === 0 || resultsRegister[0].username === 0) {

						await custom.doQuery(`
							INSERT INTO ed (username, created) 
							VALUES ("${user['username']}", CURRENT_TIMESTAMP)
							`);

						await custom.doQuery(`
							INSERT INTO ed_reminders (username) 
							VALUES ("${user['username']}")
							`);

						await custom.doQuery(`
							UPDATE user_list t1, ed_reminders t2 
							SET t2.user_alias=t1.ID 
							WHERE t2.username="${user['username']}" AND t1.userId=${user['user-id']}
							`);

						return `${user['username']}, you have been successfully registered for a dungeon 
						reminder, Your reminders will be whispered to you.`;

					} 

					if (resultsRegister[0].user_alias === getUserAlias[0].ID) {
						return `${user['username']}, you are already registered for dungeon reminders, 
						type "kb help ed" for command syntax.`;
					}
					return '';

				case 'unregister':

					if (resultsRegister.length === 0) {
						return `${user['username']}, you are not registered for a dungeon reminder, 
						therefore you can't be unregistered FeelsDankMan`;
					}

					await custom.doQuery(`
						INSERT INTO trash (username, channel, cmd, added)
						VALUES ("${user['username']}", "${channel.replace('#', '')}", "ed", CURRENT_TIMESTAMP)
						`);
					await custom.doQuery(`
						DELETE 
						FROM ed 
						WHERE user_alias="${getUserAlias[0].ID}"
						`);
					await custom.doQuery(`
						DELETE 
						FROM ed_reminders 
						WHERE user_alias="${getUserAlias[0].ID}"
						`);
					return `${user['username']}, you are no longer registered for a dungeon reminder.`;

				case 'silence':
					const checkUsers = await custom.doQuery(`
						SELECT username 
						FROM ed 
						WHERE user_alias="${getUserAlias[0].ID}"
						`);
					if (checkUsers.length === 0) {
						return `${user['username']}, you are not registered for a dungeon reminder, 
						therefore you can't be unregistered FeelsDankMan`;
					}

					const getUserPlatform = await custom.doQuery(`
						SELECT *
						FROM ed_reminders
						WHERE user_alias="${getUserAlias[0].ID}"
						`);
					if (getUserPlatform[0].initPlatform === "silence") {
						await custom.doQuery(`
							UPDATE ed_reminders
							SET initPlatform="whisper"
							WHERE user_alias="${getUserAlias[0].ID}"
							`);
						return `${user['username']}, You have set your feedback message to appear in whispers.`;
					}
					await custom.doQuery(`
						UPDATE ed_reminders
						SET initPlatform="silence"
						WHERE user_alias="${getUserAlias[0].ID}"
						`);
					return `${user['username']}, You have muted your feedback message. Use this command again to undo it.`;

				default:
					return `${user['username']}, invalid syntax. See "kb help ed" for command help.`;
			}
			return '';

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}