#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
	name: "kb surah",
	invocation: async (channel, user, message) => {
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
			utils.errorLog(err)
			return `${user['username']}, API returned an error. Please wait until it goes back online FeelsDankMan`;
		}
	}
}