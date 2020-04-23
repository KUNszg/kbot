#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const bot = require('../handler.js');
const fetch = require('node-fetch');

module.exports = {
	name: prefix + "surah",
	aliases: null,
	description: `random verse from quran -- cooldown 8s`,
	permission: 0,
	cooldown: 8000,
	invocation: async (channel, user, message, args) => {
		try {

			const randomNumberFromRange = Math.floor(Math.random() * 6237) + 1;
			const quran = `http://api.alquran.cloud/ayah/${randomNumberFromRange}/editions/quran-uthmani,en.pickthall`
			const quranApi = await fetch(quran)
				.then(response => response.json());

			if (!quranApin) {
				return 'API returned an error. Please wait until it goes back online.';
			}
			const output = `
				${quranApi.data[0].surah.englishName} - ${quranApi.data[0].surah.englishNameTranslation}: 
				${quranApi.data[0].text.split(' ').reverse().join(' ')} - ${quranApi.data[1].text} 
				${quranApi.data[0].page}:${quranApi.data[0].surah.numberOfAyahs}`;

			if (channel === "#nymn") {
				// if output contains banned phrases
				if (await custom.banphrasePass(output).banned === true) {
					bot.kb.whisper(user['username'], output);
					return `${user['username']}, the result is banphrased, 
					I whispered it to you tho cmonBruh`;		
				} 
				// if output is fine, return full message
				return `${user['username']}, ${output}`;
			}
			// other channels
			return `${user['username']}, ${output}`;

		} catch (err) {
			custom.errorLog(err)
			return `user${['username']}, ${err} FeelsDankMan!!!`
		}
	}	
}