#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;

module.exports = {
	name: prefix + "party",
	aliases: null,
	description: `kb party create(c)/join(j)/leave(l)/ready(r)/status(s) [name/ID] - create, join or leave a party of users. 
	Useful for checking who wants to play cs or who is ready for something eShrug -- cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message.toLowerCase());
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
					return `${user['username']}, your party "${partyData[0].party_name}" (ID ${partyData[0].ID}) 
					has been successfully created with 10 default slots, check "kb help party" for more options.`;

				case "disband":
				case "del":
				case "delete":
					const getPartyData = await custom.doQuery(`
						SELECT *
						FROM party
						WHERE userid="${user['user-id']}" AND status="active" AND creator="Y"
						`);
					if (getPartyData.length === 0) {
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

					if (partyDataByName.length === 0 && partyDataByID.length === 0) {
						return `${user['username']}, that party does not exist.`;
					} 

					if (partyDataByName.length === 0) {
						const sameParty = await custom.doQuery(`
							SELECT *
							FROM party 
							WHERE userid="${user['user-id']}" AND ID="${partyDataByID[0].ID}"
							`);
						if (sameParty.length != 0) {
							return `${user['username']}, you are already in that party.`;
						}

						await custom.doQuery(`
							INSERT INTO party (ID, username, userid, party_name, creator, editor, ready, slots, status, date)
							VALUES ("${partyDataByID[0].ID}", "${user['username']}", "${user['user-id']}", "${partyDataByID[0].party_name}", "N", "N", "N", "10", "inactive", CURRENT_TIMESTAMP)
							`);
						return `${user['username']}, successfully joined party "${partyDataByID[0].party_name}" owned by ${partyDataByID[0].username}`;
					}

					await custom.doQuery(`
						INSERT INTO party (ID, username, userid, party_name, creator, editor, ready, slots, status, date)
						VALUES ("${partyDataByName[0].ID}", "${user['username']}", "${user['user-id']}", "${partyDataByName[0].party_name}", "N", "N", "N", "10", "inactive", CURRENT_TIMESTAMP)	
						`);
					return `${user['username']}, successfully joined party "${partyDataByName[0].party_name}" owned by ${partyDataByName[0].userid}`;

				case "l":
				case "leave":
				case "part":
				case "ditch":
					const userPartyData = await custom.doQuery(`		
						SELECT *
						FROM party 
						WHERE userid="${user['user-id']}"
						`);
					if (userPartyData.length === 0) {
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
				case "go":
					const userData = await custom.doQuery(`		
						SELECT *
						FROM party 
						WHERE userid="${user['user-id']}"
						`);
					if (userData.length === 0) {
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
						other users in party "${userData[0].party_name}" (ID ${userData[0].ID})`;
					}

					await custom.doQuery(`
						UPDATE party 
						SET ready="Y"
						WHERE userid="${user['user-id']}"
						`);
					return `${user['username']} is ready! ${usersReady.length + 1}/${usersInParty.length} users are currently ready 
					in party "${userData[0].party_name}"`;

				case "s":	
				case "status":
					if (!partyName) {
						const party = await custom.doQuery(`
							SELECT *
							FROM party
							WHERE userid="${user['user-id']}"
							`);
						if (party.length === 0) {
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
					if (partyDataName.length === 0 && partyDataID.length === 0) {
						return `${user['username']}, that party does not exist.`;
					} 

					if (partyDataName.length === 0) {
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

				default:
					return `${user['username']}, no parameter provided. Use one of the following: "kb party create/join/leave [name]" or check "kb help party"`;
			}
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}