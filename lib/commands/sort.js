#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;

module.exports = {
	name: prefix + "Sort",
	aliases: null,
	description: `Sorts the letters until they match the input`,
	permission: 5,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {
            if (user['user-id'] != '178087241') {
                return '';
            }

            const msg = custom.getParam(message);

            const getRandomInt = (n) => {
                return Math.floor(Math.random() * n);
            }
            const shuffle = (s) => {
                const arr = s.split('');           // Convert String to array
                const n = arr.length;              // Length of the array

                for(let i=0 ; i<n-1 ; ++i) {
                    const j = getRandomInt(n);       // Get random of [0, n-1]

                    const temp = arr[i];             // Swap arr[i] and arr[j]
                    arr[i] = arr[j];
                    arr[j] = temp;
                }

                s = arr.join('');                // Convert Array to string
                return s;                        // Return shuffled string
            }

            if (msg[0].length > 6) {
                return `${user['username']}, too many characters.`;
            }

            for (let i=0; i < 26**msg[0].length; i++) {
                const shuffleString = shuffle(msg[0]);

                kb.say(channel, shuffleString)

                if (shuffleString === msg[0]) {
                    return `Sorting finished in ${i} attempts: ${shuffleString}`;
                }
            }
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`
		}
	}
}
