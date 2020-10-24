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

            if (platform === "whisper") {
                return "This command is disabled on this platform";
            }

            let msg = custom.getParam(message);

            // "sorting" by generating random numbers until it matches input
            if (msg.includes('#random')) {
                const index = msg.indexOf('#random');
                if (index > -1) {
                    msg.splice(index, 1);
                }
                msg = msg.join(' ')

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

                if (msg.length > 6) {
                    return `${user['username']}, too many characters.`;
                }

                for (let i=0; i < 26**msg.length; i++) {
                    const shuffleString = shuffle(msg);

                    kb.say(channel, shuffleString)

                    if (shuffleString === msg) {
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
                const index = msg.indexOf('#bubble');
                if (index > -1) {
                    msg.splice(index, 1);
                }

                const bubbleSort = (arr) => {
                   let len = arr.length;
                   for (let i = len-1; i>=0; i--) {
                        for(let j = 1; j<=i; j++) {
                            if(arr[j-1]>arr[j]) {
                                kb.say(channel, arr.join(''))
                                let temp = arr[j-1];
                                arr[j-1] = arr[j];
                                arr[j] = temp;
                            }
                        }
                   }
                   return arr;
                }
                return `Result of bubble sort: ${bubbleSort(msg.join(' ').split('')).join('')}`;
            }


            /*
            *    How it works:
            *      Imagine you are playing cards. Somebody is giving you cards one by one.
            *      When you are receiving card, you are planning to put them in a way so that the smaller one is on the left.
            *      This means you want to insert them in a sorted way
            */
            if (msg.includes('#selection')) {
                const index = msg.indexOf('#selection');
                if (index > -1) {
                    msg.splice(index, 1);
                }

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
                        kb.say(channel, arr.join(''));
                    }
                    return arr;
                }
                return `Result of selection sort: ${selectionSort(msg.join(' ').split('')).join('')}`;
            }

            // merge - divide and conquer type algorithm
            if (msg.includes('#merge')) {
                const index = msg.indexOf('#merge');
                if (index > -1) {
                    msg.splice(index, 1);
                }

                const mergeSort = (list) => {
                    const len = list.length

                    // an array of length == 1 is technically a sorted list
                    if (len == 1) {
                        return list
                    }

                    // get mid item
                    const middleIndex = Math.ceil(len / 2)

                    // split current list into two: left and right list
                    let leftList = list.slice(0, middleIndex)
                    let rightList = list.slice(middleIndex, len)

                    leftList = mergeSort(leftList)
                    rightList = mergeSort(rightList)

                    return merge(leftList, rightList)
                }

                // Solve the sub-problems and merge them together
                const merge = (leftList, rightList) => {
                    const sorted = []
                    while (leftList.length > 0 && rightList.length > 0) {
                        const leftItem = leftList[0]
                        const rightItem = rightList[0]
                        if (leftItem > rightItem) {
                            sorted.push(rightItem)
                            rightList.shift()
                        } else {
                            sorted.push(leftItem);
                            leftList.shift()
                        }
                        kb.say(channel, sorted.join(''))
                    }

                    // if left list has items, add what is left to the results
                    while (leftList.length !== 0) {
                        sorted.push(leftList[0])
                        leftList.shift()
                        kb.say(channel, sorted.join(''))
                    }

                    // if right list has items, add what is left to the results
                    while (rightList.length !== 0) {
                        sorted.push(rightList[0])
                        rightList.shift()
                        kb.say(channel, sorted.join(''))
                    }

                    // merge the left and right list
                    return sorted
                }

                return `Result of merge sort: ${mergeSort(msg.join(' ').split('')).join('')}`;
            }

            if (msg.includes('#cocktail')) {
                const index = msg.indexOf('#cocktail');
                if (index > -1) {
                    msg.splice(index, 1);
                }

                const cocktailSort = (nums) => {
                    let is_Sorted = true;
                    while (is_Sorted) {
                        for (let i = 0; i < nums.length - 1; i++) {
                            if (nums[i] > nums[i + 1]) {
                                let temp = nums[i];
                                nums[i] = nums[i + 1];
                                nums[i+1] = temp;
                                is_Sorted = true;
                                kb.say(channel, nums.join(''));
                            }
                        }

                        if (!is_Sorted) {
                            break;
                        }

                        is_Sorted = false;

                        for (let j = nums.length - 1; j > 0; j--) {
                            if (nums[j-1] > nums[j]) {
                                let temp = nums[j];
                                nums[j] = nums[j - 1];
                                nums[j - 1] = temp;
                                is_Sorted = true;
                                kb.say(channel, nums.join(''));
                            }
                        }
                    }
                    return nums
                }

                return `Result of cocktail sort: ${cocktailSort(msg.join(' ').split('')).join('')}`;
            }
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`
		}
	}
}
