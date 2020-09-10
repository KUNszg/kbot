#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;

module.exports = {
	name: "kb sort",
	invocation: async (channel, user, message, args) => {
		try {
            if (user['user-id'] != '178087241') {
                return '';
            }

            let msg = custom.getParam(message);

            // "sorting" by generating random numbers until it matches input
            if (msg.includes('#random')) {
                msg.join(' ').replace('#random', '').split(' ');

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
                        return `Sorting finished in ${i+1} attempts: ${shuffleString}`;
                    }
                }
            }

            /*
            *   How it works:
            *     Go through the array, find the index of the lowest element swap the lowest element with the first element.
            *     Hence first element is the lowest element in the array.
            */
            if (msg.includes('#bubble')) {
                msg.join(' ').replace('#bubble', '').split(' ');
                const bubbleSort = (arr) => {
                   let len = arr.length;
                   for (let i = len-1; i>=0; i--) {
                        for(let j = 1; j<=i; j++) {
                            if(arr[j-1]>arr[j]) {
                                let temp = arr[j-1];
                                arr[j-1] = arr[j];
                                arr[j] = temp;
                                kb.say('kunszg', temp + ' temp');
                                kb.say('kunszg', arr.join(' ') + ' arr')
                            }
                        }
                   }
                   return arr;
                }
                bubbleSort(msg)
            }


            /*
            *    How it works:
            *      Imagine you are playing cards. Somebody is giving you cards one by one.
            *      When you are receiving card, you are planning to put them in a way so that the smaller one is on the left.
            *      This means you want to insert them in a sorted way
            */
            if (msg.includes('#selection')) {
                msg.join(' ').replace('#selection', '').split(' ');
                const selectionSort = (arr) => {
                    let minIdx, temp,
                    len = arr.length;
                    for(let i = 0; i < len; i++) {
                        minIdx = i;
                        for(let  j = i+1; j<len; j++) {
                            if(arr[j]<arr[minIdx]) {
                                minIdx = j;
                            }
                        }
                        temp = arr[i];
                        arr[i] = arr[minIdx];
                        arr[minIdx] = temp;
                    }
                    return arr;
                }
            }
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`
		}
	}
}
