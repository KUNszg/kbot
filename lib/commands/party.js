#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;

module.exports = {
	name: "kb party",
	invocation: async (channel, user, message) => {
		try {
			const msg = (message.split(' ')[1].toLowerCase() === "party") ?
                custom.getParam(message.toLowerCase()) :
                custom.getParam(message.toLowerCase(), 1);

			const partyName = msg.splice(1).join(' ');

			switch (msg[0]) {
				case "create":
				case "make":
				case "c":
					if (!partyName) {
						return `${user['username']}, you have to specify party name! like that :) 👉
						kb party create my cool party name`;
					}

					const checkIfNameExists = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE party_name="${partyName}"
						`);
					if (checkIfNameExists.length != 0) {
						return `${user['username']}, party with this name already exists.`;
					}
					if (partyName.length>100) {
						return `${user['username']}, party name cannot be longer than 100 characters.`;
					}

					const checkIfActive = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE userid="${user['user-id']}" AND status="active"
						`);
					if (checkIfActive.length != 0) {
						await custom.doQuery(`
							DELETE FROM party
							WHERE ID="${checkIfActive[0].ID}"
							`);
						kb.whisper(user['username'], `your previous party has been removed because you created a new one.`);
					}

					const getId = await custom.doQuery(`
						SELECT MAX(ID) AS id
						FROM party
						`);

					await custom.doQuery(`
						INSERT INTO party (ID, username, userid, party_name, creator, editor, ready, slots, status, date)
						VALUES ("${getId[0].id + 1}", "${user['username']}", "${user['user-id']}","${partyName}", "Y", "N", "N", "10", "active", CURRENT_TIMESTAMP)
						`);

					const partyData = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE party_name="${partyName}" AND status="active"
						`);

					Date.prototype.addTime = function(sec) {
						var copiedDate = new Date(this.getTime());
						return new Date(copiedDate.getTime() + sec * 1000);
					}
					const now = new Date();

					// +36h
					await custom.doQuery(`
						UPDATE party
						SET expires="${now.addTime(129600).toISOString().slice(0, 19).replace('T', ' ')}"
						WHERE ID="${partyData[0].ID}"
						`);

					return `${user['username']}, your party "${partyData[0].party_name}" (ID ${partyData[0].ID})
					has been successfully created with 10 default slots, it will auto-disband in 36h, check "kb help party"
					for more options.`;

				case "disband":
				case "del":
				case "delete":
					const getPartyData = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE userid="${user['user-id']}" AND status="active" AND creator="Y"
						`);
					if (!getPartyData.length) {
						return `${user['username']}, you don't have any active party.`;
					}

					const getUsers = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE ID="${getPartyData[0].ID}"
						`);
					await custom.doQuery(`
						DELETE FROM party
						WHERE ID="${getPartyData[0].ID}"
						`);
					return `${user['username']}, your party "${getPartyData[0].party_name}" (ID ${getPartyData[0].ID}) has been
					disbanded and all users (${getUsers.length}) have been removed from it`;

				case "join":
				case "j":
					const checkActive = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE userid="${user['user-id']}" AND status="active"
						`);
					if (!partyName) {
						return `${user['username']}, you have to provide either party name or ID.`;
					}
					if (checkActive.length != 0) {
						return `${user['username']}, you cannot join another party if you are already owning one.
						Type "kb party disband" to remove your party.`;
					}

					const isAlreadyInParty = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE userid="${user['user-id']}"
						`);
					if (isAlreadyInParty.length != 0) {
						return `${user['username']}, you cannot join other party if you are already in one.
						Use "kb party leave" to part it.`;
					}

					const partyDataByName = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE party_name="${partyName}" AND status="active"
						`);

					const partyDataByID = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE ID="${partyName}" AND status="active"
						`);

					if (!partyDataByName.length && !partyDataByID.length) {
						return `${user['username']}, that party does not exist.`;
					}

					if (!partyDataByName.length) {
						const sameParty = await custom.doQuery(`
							SELECT *
							FROM party
							WHERE userid="${user['user-id']}" AND ID="${partyDataByID[0].ID}"
							`);
						if (sameParty.length != 0) {
							return `${user['username']}, you are already in that party.`;
						}

						Date.prototype.addTime = function(sec) {
							var copiedDate = new Date(this.getTime());
							return new Date(copiedDate.getTime() + sec * 1000);
						}
						const add = new Date();

						await custom.doQuery(`
							INSERT INTO party (ID, username, userid, party_name, creator, editor, ready, slots, status, expires, date)
							VALUES ("${partyDataByID[0].ID}", "${user['username']}", "${user['user-id']}", "${partyDataByID[0].party_name}", "N", "N", "N", "10", "inactive", "${add.addTime(129600).toISOString().slice(0, 19).replace('T', ' ')}", CURRENT_TIMESTAMP)
							`);

						return `${user['username']}, successfully joined party "${partyDataByID[0].party_name}" owned by ${partyDataByID[0].username}`;
					}

					Date.prototype.addTime = function(sec) {
						var copiedDate = new Date(this.getTime());
						return new Date(copiedDate.getTime() + sec * 1000);
					}
					const add = new Date();

					await custom.doQuery(`
						INSERT INTO party (ID, username, userid, party_name, creator, editor, ready, slots, status, expires, date)
						VALUES ("${partyDataByName[0].ID}", "${user['username']}", "${user['user-id']}", "${partyDataByName[0].party_name}", "N", "N", "N", "10", "inactive", "${add.addTime(129600).toISOString().slice(0, 19).replace('T', ' ')}",CURRENT_TIMESTAMP)
						`);
					return `${user['username']}, successfully joined party "${partyDataByName[0].party_name}" owned by ${partyDataByName[0].username}`;

				case "l":
				case "leave":
				case "part":
				case "ditch":
					const userPartyData = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE userid="${user['user-id']}"
						`);
					if (!userPartyData.length) {
						return `${user['username']}, you are not in any party. Check "kb help party" for details.`;
					}
					if (userPartyData[0].creator === "Y") {
						return `${user['username']}, you are a creator of this party, use "kb party disband" to disband it.`;
					}

					await custom.doQuery(`
						DELETE FROM party
						WHERE userid="${user['user-id']}" AND ID="${userPartyData[0].ID}"
						`);
					return `${user['username']}, you have successfully abandoned party "${userPartyData[0].party_name}" (ID ${userPartyData[0].ID})`;

				case "r":
				case "ready":
					const userData = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE userid="${user['user-id']}"
						`);
					if (!userData.length) {
						return `${user['username']}, you are not in any party. Check "kb help party" for details.`;
					}

					const usersReady = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE ID="${userData[0].ID}" AND ready="Y"
						`);
					const usersInParty = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE ID="${userData[0].ID}"
						`);

					if (userData[0].ready === "Y") {
						return `${user['username']}, you are already ready with ${usersReady.length}/${usersInParty.length}
						other users in current party "${userData[0].party_name}" (ID ${userData[0].ID})`;
					}

					await custom.doQuery(`
						UPDATE party
						SET ready="Y"
						WHERE userid="${user['user-id']}"
						`);
					return `${user['username']} is ready! ${usersReady.length + 1}/${usersInParty.length} users are currently ready
					in party "${userData[0].party_name}"`;

				case "unready":
					const userDataUnready = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE userid="${user['user-id']}"
						`);
					if (!userDataUnready.length) {
						return `${user['username']}, you are not in any party. Check "kb help party" for details.`;
					}

					const usersUnready = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE ID="${userDataUnready[0].ID}" AND ready="N"
						`);
					const usersInPartyUnready = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE ID="${userDataUnready[0].ID}"
						`);

					if (userDataUnready[0].ready === "N") {
						return `${user['username']}, [#err] your status is not set to ready (use "kb party ready" to set this status)`;
					}

					await custom.doQuery(`
						UPDATE party
						SET ready="N"
						WHERE userid="${user['user-id']}"
						`);
					return `${user['username']}'s status has been changed to not ready! ${usersUnready.length + 1}/${usersInPartyUnready.length} other users are currently ready
					in party "${userDataUnready[0].party_name}"`;

				case "s":
				case "status":
					if (!partyName) {
						const party = await custom.doQuery(`
							SELECT *
							FROM party
							WHERE userid="${user['user-id']}"
							`);
						if (!party.length) {
							return `${user['username']}, you are not in any party.`;
						}

						const partyCreator = await custom.doQuery(`
							SELECT *
							FROM party
							WHERE ID="${party[0].ID}" AND creator="Y"
							`);
						const usersReady = await custom.doQuery(`
							SELECT *
							FROM party
							WHERE ID="${party[0].ID}" AND ready="Y"
							`);
						const usersInParty = await custom.doQuery(`
							SELECT *
							FROM party
							WHERE ID="${party[0].ID}"
							`);

						return `${user['username']}, data for party you are in :) 👉  ID: ${party[0].ID},
						name: ${party[0].party_name.substr(0, 20)}, creator: ${partyCreator[0].username},
						users ready: ${usersReady.length}/${usersInParty.length}, slots: ${party[0].slots}`;
					}

					const partyDataName = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE party_name="${partyName}" AND status="active"
						`);
					const partyDataID = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE ID="${partyName}" AND status="active"
						`);
					if (!partyDataName.length && !partyDataID.length) {
						return `${user['username']}, that party does not exist.`;
					}

					if (!partyDataName.length) {
						const usersReady = await custom.doQuery(`
							SELECT *
							FROM party
							WHERE ID="${partyDataID[0].ID}" AND ready="Y"
							`);
						const usersInParty = await custom.doQuery(`
							SELECT *
							FROM party
							WHERE ID="${partyDataID[0].ID}"
							`);
						return `${user['username']}, data for given party :) 👉  ID: ${partyDataID[0].ID},
						name: ${partyDataID[0].party_name.substr(0, 20)}, creator: ${partyDataID[0].username},
						users ready: ${usersReady.length}/${usersInParty.length}, slots: ${partyDataID[0].slots}`;
					}

					const usersReadyName = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE ID="${partyDataName[0].ID}" AND ready="Y"
						`);
					const usersInPartyName = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE ID="${partyDataName[0].ID}"
						`);
					return `${user['username']}, data for given party :) 👉  ID: ${partyDataName[0].ID},
					name: ${partyDataName[0].party_name.substr(0, 20)}, creator: ${partyDataName[0].username},
					users ready: ${usersReadyName.length}/${usersInPartyName.length}, slots: ${partyDataName[0].slots}`;

				case "list":
					const partyDataList = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE userid="${user['user-id']}"
						`);
					if (!partyDataList.length) {
						return `${user['username']}, you are not in any party.`;
					}

					const usersInPartyList = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE ID="${partyDataList[0].ID}"
						`);

					kb.whisper(user['username'], `users in party "${partyDataList[0].party_name}": ${usersInPartyList.map(i => `${i.username}(${i.ready === "Y" ? "R" : "NR"})`).join(', ')}`);
					return `${user['username']}, I whispered you the list of users :)`;

				case "ping":
					if (custom.strictChannels(channel)) {
						return `${user['username']}, this syntax is disabled in this channel :/`;
					}

					const partyDataPing = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE userid="${user['user-id']}"
						`);
					if (!partyDataPing.length) {
						return `${user['username']}, you are not in any party.`;
					}

					if (partyDataPing[0].creator === "N") {
						return `${user['username']}, only owners of the party can use this command.`;
					}

					const usersInPartyPing = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE ID="${partyDataPing[0].ID}"
						`);
					if (usersInPartyPing.length === 1) {
						return `${user['username']}, you are the only person in this party FeelsDankMan`;
					}
					if (usersInPartyPing.length > 14) {
						return `${user['username']}, I cannot bing more than 14 people monkaS you can do it yourself by getting a list of users with "kb party list"`;
					}

					function sleep(milliseconds) {
						var start = new Date().getTime();
						for (var i = 0; i < 1e7; i++) {
							if ((new Date().getTime() - start) > milliseconds) {
								break;
							}
						}
					}

					const arrayOfUsers = usersInPartyPing.map(i => i.username).filter(i => i != partyDataPing[0].username);

					for (let i=0; i<=14; i++) {
						if (i === 5) {
							kb.say(channel, `${partyDataPing[0].username.replace(/^(.{2})/, "$1\u{E0000}")} is binging, it is time FeelsDankMan 🔔 ${arrayOfUsers.slice(0, 4).join(', ')}`);
							sleep(1700);
						}
						if (i === 10) {
							kb.say(channel, `${partyDataPing[0].username.replace(/^(.{2})/, "$1\u{E0000}")} is binging, it is time FeelsDankMan 🔔 ${arrayOfUsers.slice(4, 9).join(', ')}`);
							sleep(1700);
						}
						if (i === 15) {
							kb.say(channel, `${partyDataPing[0].username.replace(/^(.{2})/, "$1\u{E0000}")} is binging, it is time FeelsDankMan 🔔 ${arrayOfUsers.slice(9, 14).join(', ')}`);
							sleep(1700);
						}
					}
					return '';

				default:
					return `${user['username']}, no parameter provided. Use one of the following: "kb party create/join/leave [name]" or check "kb help party"`;
			}
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}
