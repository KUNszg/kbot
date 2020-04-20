#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "ping",
	aliases: null,
	description: `syntax: kb ping [service] | no parameter - data about latest github activity |
	service - checks if server/domain is alive -- cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args, err) => {
		try {

			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(2);

			const apiCommits = "https://api.github.com/repos/KUNszg/kbot/commits?per_page=100";
			const urls = [
				apiCommits, 
				apiCommits + '&page=2', 
				apiCommits + '&page=3', 
				apiCommits + '&page=4', 
				apiCommits + '&page=5', 
				apiCommits + '&page=6',
				apiCommits + '&page=7',
				apiCommits + "&page=8"
				];

			const fetch = require('node-fetch');
			async function getAllUrls(urls) {
			    try {
			        var data = await Promise.all(
			            urls.map(url =>
							fetch(url).then((response) => response.json()))
			            );
			        return data
			    } catch (error) {
			        console.log(error)
			        throw (error)
			    }
			}

			const commitsCount = await getAllUrls(urls);
			const countCommits = ((commitsCount.length * 100) - 
				(100 - commitsCount[commitsCount.length-1].length));
			const commitDate = new Date(commitsCount[0][0].commit.committer.date);
			const serverDate = new Date();
			const diff = Math.abs(commitDate - serverDate)
			const latestCommit = (diff / 1000).toFixed(2);

			if (latestCommit > 259200) {
				return `${user['username']}, pong FeelsDankMan 🏓 ppHop 🏓💻 my website 
				(under development) https://kunszg.xyz/ latest commit: ${(latestCommit / 86400).toFixed(0)} 
				ago (master, ${commitsCount[0][0].sha.slice(0, 7)}, commit ${countCommits})`;
			} 
			return `${user['username']}, pong FeelsDankMan 🏓 ppHop 🏓💻 check out my website 
			(under development) https://kunszg.xyz/ latest commit: ${custom.formatPing(latestCommit)} ago 
			(master, ${commitsCount[0][0].sha.slice(0, 7)}, commit ${countCommits})`;	

		} catch (err) {
			custom.errorLog(err)
			if (err.message.includes("undefined")) {
				return `${user['username']}, N OMEGALUL`;
			}
			return 	`${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}