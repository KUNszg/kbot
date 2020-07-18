#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const bot = require('../handler.js');

module.exports = {
	name: prefix + "surah",
	aliases: null,
	description: `random verse from quran -- cooldown 8s`,
	permission: 0,
	cooldown: 8000,
	invocation: async (channel, user, message, args) => {
		try {
			const randomNumberFromRange = Math.floor(Math.random() * 6237) + 1;
			const quran = `http://api.alquran.cloud/ayah/${randomNumberFromRange}/editions/quran-uthmani,en.pickthall`;
			const got = require('got');
			const quranApi = await got(quran).json()

			const output = ` ${quranApi.data[0].surah.englishName} - ${quranApi.data[0].surah.englishNameTranslation}: 
				${quranApi.data[0].text.split(' ').reverse().join(' ')} - ${quranApi.data[1].text} 
				${quranApi.data[0].page}:${quranApi.data[0].surah.numberOfAyahs}`;

			return `${user['username']}, ${output}`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, API returned an error. Please wait until it goes back online FeelsDankMan`;
		}
	}	
}