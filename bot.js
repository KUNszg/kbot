#!/usr/bin/env node

'use strict';

const fs = require('fs');
const api = require('./config.js');

// parse the channel list 
// check for empty items in an array
const channelOptions = fs.readFileSync('./db/channels.js').toString().split('"').filter(
	function(i){return i != null;}).join('').split(' ')
const options = {
	options: {
		debug: true,
	},
	connection: {
		cluster: 'aws',
	},
	identity: {
		username: 'kunszgbot',
		password: api.oauth,
	},
	channels: channelOptions,
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
const repeatedMessages = {
	supinic: null
};

kb.connect();
kb.on('connected', (adress, port) => {

kb.say('kunszg', 'reconnected KKona')
const randomApod = require('random-apod'); //apod command - for random astro pic of the day
const randomWords = require("random-words"); //yt command - for random words to use in youtube search
const search = require("youtube-search"); // rt and yt commands - random video using random words api
const si = require('systeminformation'); //ping command - ram usage
const os = require('os');//uptime command - system uptime
const rndSong = require('rnd-song');//rt command - random track using youtube search api
const rf = require('random-facts');//rf command - random fact
const count = require('mathjs');
const rUni = require('random-unicodes');
const SpacexApiWrapper = require("spacex-api-wrapper");
const fetch = require("node-fetch");
const perf = require('execution-time')();
const mysql = require('mysql');
const con = mysql.createConnection({
	host: "localhost",
	user: api.db_user,
	password: api.db_pass,
	database: "kbot"
});
con.connect(function(err) {
  	if (err) {
  		kb.say('supinic', '@kunszg, database connection error monkaS')
  		console.log(err)
	} else {
  		console.log("Connected!");
  	}
});

const allowFastramid = [
	{ID: '178087241'}, //kunszg
	{ID: '229225576'}, //kunszgbot
	{ID: '40379362'} //sinris
];	
const allowEval = [
	{ID: '178087241'}, //kunszg
	{ID: '229225576'}, //kunszgbot
	{ID: '458101504'}, //notkunszg
	{ID: '31400525'} //supinic
];

const prefix = "kb ";
const commandsExecuted = [];
const talkedRecently = new Set();
const commands = [
	{
	    name: prefix + "uptime",
	    aliases: null,
	    description: 'displays informations about current runtime of the bot, lines, memory usage, host uptime and commands used in the current session - cooldown 8s',
	    invocation: async (channel, user, message, args) => {
		 	try{
		      	function format(seconds){
			        function pad(s){
			        	return (s < 10 ? '0' : '') + s;
					}
			        var hours = Math.floor(seconds / (60*60));
			        var minutes = Math.floor(seconds % (60*60) / 60);
			        var seconds = Math.floor(seconds % 60);
			        if (hours === 0 && minutes != 0) {
			        	return minutes + 'm ' + seconds + "s";
			        } else {
			        	if (minutes === 0 && hours === 0) {
			        		return seconds + "s"
			        	}
			        	else if (seconds === 5 || hours === 0 && minutes === 0) {
				        		return 'few seconds'
			        	}
			        	else {
			        		return hours + 'h ' + minutes + 'm ' + seconds + "s"; 
			        	}
			        }
			    } 
				const fs = require("fs");
				const stats = fs.statSync("./bot.js");
				const fileSizeInBytes = stats['size'];
				const size = fileSizeInBytes/1000
				const used = process.memoryUsage().heapUsed/1024/1024;
			    const uptime = process.uptime();
			    const os = require('os');
			    const up = os.uptime()/3600; //system uptime in hours
		        const up2 = os.uptime()/86400; //system uptime in days
		        const linecount = require('linecount')
		        const lines = await new Promise((resolve, reject) => { //line count	
	        	linecount('./bot.js', (err, count) => {
			       	if (err) {
			            reject(err);
				    } else {
			        	resolve(count);
					    }   
				    });
				});
				if (talkedRecently.has(user['user-id'])) {
		        	return '';  
			    } else {   
			     	talkedRecently.add(user['user-id']);
	        		setTimeout(() => {
	              		talkedRecently.delete(user['user-id']);
		            }, 8000);
		        }
		        if (up>72 && uptime<172800) {
	        		return user['username'] + ", code is running for " + format(uptime) + ", has " + lines + " lines,  memory usage: " + 
					    used.toFixed(2) + " MB, host is up for " +  up2.toFixed(2) + " days, commands used in this session " + commandsExecuted.length + " FeelsDankMan";
				} else {
					if (uptime>172800 && up>72) {
						return user['username'] + ", code is running for " +  uptime/86400 + ", has " + lines + " lines,  memory usage: " + 
					    	used.toFixed(2) + " MB, host is up for " + up.toFixed(1) + "h (" +  up2.toFixed(2) + " days), commands used in this session " + commandsExecuted.length + " FeelsDankMan";
					}
					else if (uptime>172800 && up<72) {
						return user['username'] + ", code is running for " +  uptime/86400 + ", has " + lines + " lines,  memory usage: " + 
					 	   used.toFixed(2) + " MB, host is up for " + up.toFixed(1) + "h, commands used in this session " + commandsExecuted.length + " FeelsDankMan";
					}
					else {
						return user['username'] + ", code is running for " + format(uptime) + ", has " + lines + " lines,  memory usage: " + 
					    	(used).toFixed(2) + " MB, host is up for " + up.toFixed(1) + "h (" + up2.toFixed(2) + " days), commands used in this session " + commandsExecuted.length + " FeelsDankMan";
					}
				}
			} catch(err) { 
		  	    return user['username'] + ", " + err + " FeelsDankMan !!!";
	        }
	    }
	},

	{
	    name: prefix + "ping",
		aliases: null,
		description: "syntax: kb ping [service] | no parameter - data about latest github activity | service - checks if server/domain is alive - cooldown 5s",
	    invocation: async (channel, user, message, args, err) => {
		    try {	
		    	const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2);
		      	function format(seconds){
			        function pad(s){
			        	return (s < 10 ? '0' : '') + s;
					}
			        var hours = Math.floor(seconds / (60*60));
			        var minutes = Math.floor(seconds % (60*60) / 60);
			        var seconds = Math.floor(seconds % 60);
			        if (hours === 0 && minutes != 0) {
			        	return minutes + 'm ' + seconds + "s";
			        } else {
			        	if (minutes === 0 && hours === 0) {
			        		return seconds + "s"
			        	}
			        	else if (seconds === 5 || hours === 0 && minutes === 0) {
			        		return '0s'
			        	}
			        	else {
			        		return hours + 'h ' + minutes + 'm ' + seconds + "s"; 
			        	}
			        }
			    } 
				if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
		       	 	return '';   
			    } else {   
			     	talkedRecently.add(user['user-id']);
	            		setTimeout(() => {
	              			talkedRecently.delete(user['user-id']);
		            }, 5000);
		        }
			    if (!msg[0]) {
			    	const commits = await fetch('https://api.github.com/repos/KUNszg/kbot/commits?per_page=100')
				 		.then(response => response.json());
			 		const commits2 = await fetch('https://api.github.com/repos/KUNszg/kbot/commits?page=2&per_page=100')
				 		.then(response => response.json());
			 		const commits3 = await fetch('https://api.github.com/repos/KUNszg/kbot/commits?page=3&per_page=100')
				 		.then(response => response.json());
				 	const commitsCount = commits.length + commits2.length + commits3.length;
				 	const commitDate = new Date(commits[0].commit.committer.date);
				 	const serverDate = new Date();
				 	const diff = Math.abs(commitDate-serverDate)
			      	const latestCommit = (diff/1000).toFixed(2);
			        const ping = await kb.ping();
			        if (latestCommit>259200) {
			        	return user['username'] + ", pong FeelsDankMan 🏓 ppHop 🏓💻 latest commit: "   + (latestCommit/86400).toFixed(0) + " ago (master, " +  commits[0].sha.slice(0, 7)  + ", commit " + commitsCount + ")"; 
			        } else {
				    	return user['username'] + ", pong FeelsDankMan 🏓 ppHop 🏓💻 latest commit: "   + format(latestCommit) + " ago (master, " +  commits[0].sha.slice(0, 7)  + ", commit " + commitsCount + ")"; 
					}
				}
				else {
					const ping = require('ping');
					const hosts = [msg[0]];
					hosts.forEach(function(host){
					    ping.sys.probe(host, function(isAlive) {
					        const mesg = isAlive ? 'host ' + host + ' is alive FeelsGoodMan' : 'host ' + host + ' is dead FeelsBadMan';
					        kb.say(channel, user['username'] + ', ' + mesg)
					    });
					});
				}
				return '';
		    } catch(err) {
				if (err.message.includes("undefined")) {
					return user['username'] + ", N OMEGALUL"
				}
	  	       	else {
	  	       		return user['username'] + ", " + err + " FeelsDankMan !!!";
	  	       	}
        	}
		}
	},

	{
	    name: prefix + "spacex",
	    aliases: null,
    	description: "data from SpaceX about next launch rocket launch date, mission and launch site - cooldown 15s",
	    invocation: async (channel, user, message, args) => {
    		try {
			    const space = await SpacexApiWrapper.getNextLaunch();
			    const date = await space.launch_date_utc;
			    const apiDate = new Date(date);
			 	const serverDate = new Date();
			 	const diff = Math.abs(serverDate-apiDate)
		      	const DifftoSeconds = (diff / 1000).toFixed(0);
		      	const toHours = (DifftoSeconds / 3600).toFixed(0);
		      	function format(seconds){
			        function pad(s){
			        	return (s < 10 ? '0' : '') + s;
					}
			        var hours = Math.floor(seconds / (60*60));
			        var minutes = Math.floor(seconds % (60*60) / 60);
			        var seconds = Math.floor(seconds % 60);
			        if (hours === 0 && minutes != 0) {
			        	return minutes + 'm ' + seconds + "s";
			        } else {
			        	if (minutes === 0 && hours === 0) {
			        		return seconds + "s"
			        	}
			        	else if (seconds === 0 || hours === 0 && minutes === 0) {
				        		return 'few seconds'
			        	}
			        	else {
			        		return hours + 'h ' + minutes + 'm ' + seconds + "s"; 
			        	}
			        }
			    } 
				if (talkedRecently.has(user['user-id'])) {
		        	return '';  
			    } else {   
			     	talkedRecently.add(user['user-id']);
		            setTimeout(() => {
		              	talkedRecently.delete(user['user-id']);
		            }, 15000);
		        }
		        if (toHours > 72) {
		        	return "Next rocket launch by SpaceX in " + (toHours/24).toFixed(0) + " days, rocket " + space.rocket.rocket_name + ", mission " + space.mission_name +
				    	", " + space.launch_site.site_name_long;
		        } else {
	      		 	return "Next rocket launch by SpaceX in " + format(DifftoSeconds) + ", rocket " + space.rocket.rocket_name + ", mission " + space.mission_name +
					    ", " + space.launch_site.site_name_long;
				}
			} catch(err) {
		  	    return user['username'] + ", " + err + " FeelsDankMan !!!";
        	}
        }
    },

	{
	    name: prefix + "apod",
	    aliases: null,
	    description: "syntax: kb apod [random] | no parameter - astronomical picture for today | random - APOD from a random day, data gathered from NASA's API reaching year 1997 - cooldown 6s",
	    invocation: async (channel, user, message, args) => {
    		try {
    			const msg = message.split(' ').splice(2); 
	        	const apodRandom = await randomApod();

   				if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
	       			return '';  
		    	} else {   
		     		talkedRecently.add(user['user-id']);
        			setTimeout(() => {
               		 	talkedRecently.delete(user['user-id']);
		            }, 6000);
		        }
		        if (msg[0] === 'random') {
			    	return user['username'] + ", here is your random 🌌 picture of the day | " +
		            	apodRandom.title + ": " + apodRandom.image;
	        	} else {
	        		const apodToday = await fetch('https://api.nasa.gov/planetary/apod' + api.nasa2.replace('&', '?'))
			 			.then(response => response.json());
		 			return user['username'] + ', APOD for today SeemsGood ' + apodToday.title + ' | ' + apodToday.hdurl + ' | by ' + apodToday.copyright 
	     		}   
			} catch(err) {
		  	    return user['username'] + ", " + err + " FeelsDankMan !!!";
	        }
  	    }	
    },

	{
	    name: prefix + "yt",
	    aliases: null,
	    description: "syntax: kb yt [query] | query - search for a YouTube video with provided query - cooldown 7s",
	    invocation: async (channel, user, message, args) => {
    		try {
    			const msg = message.split(" ").splice(2);
    			const random1 = await search(msg.join(" "), {
		          	totalResults: 3,
		          	maxResults: 2,
		          	type: "video",
		       	  	safeSearch: "strict",
		          	key: api.youtube
		        });

				if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
        			return '';  
	    		} else {   
	     			talkedRecently.add(user['user-id']);
        			setTimeout(() => {
          				talkedRecently.delete(user['user-id']);
		            }, 7000);
		        }
        		if (msg[0].length > 0) {
					return user['username'] + ", results with searched phrase '" + msg.join(" ") + "' => " + random1.results[0].link
        		}
				else if (!msg[0]) {
					return user['username'] + ", please provide a phrase to search with :)";
				}
        	} catch (err) {
          		if (err.message.includes("'link' of undefined")) {  
       	  			return (user['username'] + ", no youtube link was found with provided phrase :(")
         		}
         		if (err.message.includes("status code 403")) {
		        	return user['username'] + ", " + "[error 403] seems like we ran out of daily requests (that means the loop bug is still not fixed PepeLaugh )";
         		}
		   		else {
		   			return user['username'] + ", " + err + " FeelsDankMan ❗";
		   		}
		    }
	    }
	},
	   
	{
	    name: prefix + "rt",
	    aliases: null,
	    description: "syntax: kb rt [ID] | no parameter - returns a link to the list of genres | ID - search for the song in the specified genre (numeric ID) - cooldown 5s",
	    invocation: async (channel, user, message, args) => {
		 	try{
		 		const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(" ").splice(2);
		        const options = {
		          	api_key: api.randomTrack,
		          	genre: msg[0], //21, 1134, 1147
		          	snippet: false,
		          	language: 'en'
		        };
		        const songData = await new Promise((resolve, reject) => {
		        	rndSong(options, (err, res) => {
				        if (err) {
				          reject(err);
				        }
				        else {
				          resolve(res);
			            }
			        });
			    });
		        const random = await search(songData.track.track_name + " by " + songData.track.artist_name, {
	     		   	maxResults: 1,
       		 		key: api.youtube
		        });
				if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
			        return '';      
			    } else {   
			     	talkedRecently.add(user['user-id']);
        			setTimeout(() => {
		              	talkedRecently.delete(user['user-id']);
		            }, 5000);
		        }
		        if (msg.join(" ") === "") {
		        	return user['username'] + ", list of genres (type in the genre identifier like eg.: kbot rt 15) https://pastebin.com/p5XvHkzn";
		        }
		        else {
    		 		if (channel != '#supinic') {
    		 			console.log(random.results[0])
    		 			return user['username'] + ', ' + songData.track.track_name + " by " + songData.track.artist_name + ', ' + random.results[0].link;
 		            }
		        	else if (channel === '#supinic') { 
		        		return '$sr ' + random.results[0].link;
		      		}
		      		else {
		      			return user['username'] + ", something fucked up 4HEad , list of genres: https://pastebin.com/p5XvHkzn";
		      		}
		        }
	        } catch(err) {
	        	return user['username'] + ", " + err + " FeelsDankMan ❗";
	        }
        }
    },

	{
	    name: prefix + "rf",
	    aliases: null,
	    description: "random fact. Provides facts about random stuff - cooldown 5s",
	    invocation: async (channel, user, message, args) => {
			try {
				const json = await fetch(api.randomFact)
				 	.then(response => response.json());

	 			if (talkedRecently.has(user['user-id'])) {
		        	return '';  
			    } else {   
			     	talkedRecently.add(user['user-id']);
	            	setTimeout(() => {
	              		talkedRecently.delete(user['user-id']);
		            }, 5000);
		        }
				return user['username'] + ", " + json.text.toLowerCase() + " 🤔";
	   		} catch(err) { 	
	  	    	return user['username'] + ", " + err + " FeelsDankMan !!!";
	  		}
        }
  	},  

	{
		name: prefix + "channels",
		aliases: prefix + "chn",
		description: "displays all the channels the bot is currently in. | Permitted users syntax: kb chn [join-save/part-session/join-session] [channel] - cooldown 5s",
		invocation: async (channel, user, message, args) => {			
		try {	
			const length = kb.getChannels().length;
			const joinedChannels = kb.getChannels().toString().split("").toString().replace(/,/g,"\u{E0000}").replace(/#/g, ", ").replace(","," ");
			const msg = message.replace("\u{E0000}", "").split(" ").splice(2);	
			if (talkedRecently.has(user['user-id'])) {
	       		return '';    
		    } else {   
		     	talkedRecently.add(user['user-id']);
            	setTimeout(() => {
              		talkedRecently.delete(user['user-id']);
	            }, 5000);
	        }
	        console.log(msg)
			// Non-administrator people
			if (user['user-id'] != "178087241") {
		    	return "I'm active in " + length + " channels => " + joinedChannels + " 4Head";
			}
			
			// administrator
			else {
			    if (msg[0] && !msg[1]) {
			        return user['username'] + ", invalid parameter or no channel provided";
			    }
			    else if (msg[0] == "join-session") { 
		       	 	kb.join(msg[1]);
		        	return "successfully joined :) 👍";
			    }
			    else if (msg[0] == "join-save") { 
		    		fs.appendFileSync('./db/channels.js', ' "' + msg[1] + '"'); 
		       	 	kb.join(msg[1]);
		        	return "successfully joined :) 👍";
			    }
			    else if (msg[0] == "part-session") {
			        kb.part(msg[1]);       
			        return "parted the channel for this session";
			    }
			    else if (!msg[0] && !msg[1]) {
			        return "I'm active in " + length + " channels => " + joinedChannels + " 4Head";
			    }
			    else {
			        return "I'm active in " + length + " channels => " + joinedChannels + " 4Head";
			    }
			}
		} catch(err) { 	
	  	    	return user['username'] + ", " + err + " FeelsDankMan !!!";
	  		}
		}
	},
		
	{
		name: prefix + "decode",
		aliases: null,
		description: "syntax: kb decode [binary] | binary - decode given full octet binary code into unicode characters - cooldown 5s",
		invocation: async (channel, user, message, args) => {
			try {
				const msg = message.split(" ").splice(2);
				if (talkedRecently.has(user['user-id'])) {
		        	return '';  
			    } else {   
			     	talkedRecently.add(user['user-id']);
	            	setTimeout(() => {
	              		talkedRecently.delete(user['user-id']);
		            }, 5000);
		        }
				if (!msg.join("")) {
					return user['username'] + ", please provide binary code to convert :)"
				} else {
					if (msg.join(' ').split(" ").map(i => String.fromCharCode(parseInt(i, 2))).join("") === "") {
						return user['username'] + ', an error occured monkaS check if you are using correct octets (eg.:01010001)'
					}
					if (!msg.join(' ').includes(/\d/)) {
						return user['username'] + ', you can decode only full octet binary code';
					}
					else {
		  				return user['username'] + ", " + msg.join(' ').split(" ").map(i => String.fromCharCode(parseInt(i, 2))).join("");
					}
				}
			} catch(err) {
  	   			return user['username'] + ", " + err + " FeelsDankMan !!!";
           	}
	    }
	},

	{
		name: prefix + "encode",
		aliases: null,
		description: "syntax: kb encode [character] | character - encode any character into binary code - cooldown 5s",
		invocation: async (channel, user, message, args) => {
			try {
				const msg = message.split(" ").splice(2);	
	 			if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
		        	return '';  
			    } else {   
			     	talkedRecently.add(user['user-id']);
            		setTimeout(() => {
	              		talkedRecently.delete(user['user-id']);
		            }, 5000);
		        }
		        const response = msg.join(" ").replace(/[\u{E0000}|\u{206d}]/gu, '').split("").map(i => i.charCodeAt(0).toString(2)).join(" ");
				if (!msg.join(" ")) {
					return user['username'] + ", please provide text to convert B)"
				}
				else {
					if (response.length > 500) {
						return user['username'] + ', returned message is too long to be displayed in chat (>500 characters)';
					}
					else {
		  				return user['username'] + ', ' + response;
	  				}
				}
			} catch(err) {    	
		  	    return user['username'] + ", " + err + " FeelsDankMan !!!";
	        }
	    }
	},

	{
		name: prefix + "chat",
		aliases: prefix + "ct",
		description: "syntax: kb chat [message] | message - provide a message to chat with the AI bot, no parameter will return error",
		invocation: async (channel, user, message, args) => {
			try {
				const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(" ").splice(2);
				const json = await fetch("https://some-random-api.ml/chatbot/beta?message=" + msg.join("+").normalize("NFD").replace(/[\u0300-\u036f]/g, "")) //chat
				 	.then(response => response.json());
			 	function capitalizeFirstLetter(string) {
    				return string.charAt(0).toUpperCase() + string.slice(1);
				}

				if (!msg.join(" ")) {
					return user['username'] + ", please provide a text for me to respond to :)"
				}
				else {
					if (msg.includes("homeless")) {
						return user['username'] + ", just get a house 4House"
			 		}
					else if (msg.includes("forsen")) {
					 	return user['username'] + ", maldsen LULW"
				 	}
				 	else if (((json.response.charAt(0).toLowerCase() + json.response.slice(1)).replace(".", " 4Head ").replace("?", "? :) ").replace("ń","n").replace("!", "! :o ")) === '') {
				 		return user['username'] + ', [err CT1] - bad response monkaS'
				 	}
					else {
						return user['username'] + ", " + (json.response.charAt(0).toLowerCase() + json.response.slice(1)).replace(".", " 4Head ").replace("?", "? :) ").replace("ń","n").replace("!", "! :o ");
				 	}
				}		
			} catch(err) {
				if (err.message) {
					console.log(err.message);
					return user['username'] + ", an error occured while fetching data monkaS";
				}
				else {
  	    			return user['username'] + ", " + err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '') + " FeelsDankMan !!!";	
				}	
           	}
	  	}
	},

	{
		name: prefix + "eval",
		aliases: null,
		permission: 'restricted',
		description: "debugging command, permitted users only - no cooldown",
		invocation: async (channel, user, message, args) => {
			try{
				const msg = message.split(" ").splice(2);
				const ping = await kb.ping();
				const women = {};
				const rU = eval('"' + rUni({ min: 0, max: 1114109 }).replace('u', 'u{') + '}"');	
				const perms = allowEval.filter(
					i => i.ID === user['user-id']
					);
				const shell = require('child_process');

				if (!perms[0]) {
					return "";
				}
				else {
					if (msg.join(" ").toLowerCase() === "return typeof supinic") {
						return "hackerman"
					}
					else if (msg.join(" ").toLowerCase().includes("api")) {
						return user['username'] + ', api key :/'
					}
					else {
						function reverse(s) {
							return s.split('').reverse().join('');
						}
						function hasNumber(myString) {
	 					  	return /\d/.test(myString);
						}
						function sleep(milliseconds) {
						  	var start = new Date().getTime();
						  	for (var i = 0; i < 1e7; i++) {
						    	if ((new Date().getTime() - start) > milliseconds){
						      		break;
						   		}
						  	}
						}
						function escapeUnicode(str) {
						    return str.replace(/[^\0-~]/g, function(ch) {
						        return "\\u{" + ("000" + ch.charCodeAt().toString(16)).slice(-4) + '}';
						    });
						}
						const ev = await eval('(async () => {' + msg.join(" ").replace(/[\u{E0000}|\u{206d}]/gu, '') + '})()');
						console.log(ev)
						return String(ev);
					}
				}
			} catch(err) {
				console.log(err);
				 return user['username'] + ", " + err + " FeelsDankMan !!!";
			}
		}
	},

	{
		name: prefix + "pattern",
		aliases: null,
		permission: 'restricted',
		description: "permitted users syntax: kb pattern [fast/slow] [pyramid/triangle] [height] [message] | Invalid or missing parameter will return an error - no cooldown",
		invocation: async (channel, user, message, args) => {
			try {
				const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(2);
				const emote = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(5);
				const msgP = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(4);
				const emoteP = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(5);
				const patterns = [
					{pattern: 'pyramid'},
					{pattern: 'square'},
					{pattern: 'circle'},
					{pattern: 'triangle'}
				];
				const cases = [
					{case: 'slow'},
					{case: 'fast'}
				];
				const caseChosen = cases.filter( 
					i => i.case === msg[0]
				);
				const patternChosen = patterns.filter( 
					i => i.pattern === msg[1]
				);
				const perms = allowFastramid.filter(
					i => i.ID === user['user-id']
				);
				function hasNumber(myString) {
				 	return /\d/.test(myString);
				}
				function sleep(milliseconds) {
		 	 		var start = new Date().getTime();
		  			for (var i = 0; i < 1e7; i++) {
				    	if ((new Date().getTime() - start) > milliseconds){
				      		break;
			    		}
			  		}
				}
				if (!perms[0]) {
					return "";
				} else {
					if (!msg[0]) {
						return user['username'] + ', no parameters provided (fast, slow) [err#1]';
					}
					else if (!caseChosen[0] || msg[0] != caseChosen[0].case) {
						return user['username'] + ', invalid first parameter (fast, slow) [err#2]';
					}
					else if (!patternChosen[0] || msg[1] != patternChosen[0].pattern) {
						return user['username'] + ', invalid second parameter (' + patterns.map(i => i.pattern).join(', ') + ') [err#3]';
					}
					else if (!msg[2] || !hasNumber(msg[2])) {
						return user['username'] + ', invalid third parameter (number) [err#4]';
					}
					else if (!emote[0] || !emote.join(' ').match(/[a-z]/i)) {
						return user['username'] + ', invalid fourth parameter (word) [err#5]';
					}
					else if (user['user-id'] === '40379362' && msg[2]>50) { //sinris user id
						return user['username'] + ", i can't allow pyramids higher than 50 FeelsBadMan";
					}
					else {
						if (caseChosen[0].case === 'fast' && patternChosen[0].pattern === 'pyramid') {
							function createPyramid (height) {
							  	for (var i = 1; i <= height; i++) {
							    	var row = '';

							    	for (var j = 1; j <= i; j++) 
						      		row += " " + emoteP[Math.floor(Math.random()*emoteP.length)]; 
					  		  		kb.say(channel, row);
								}
							  	for (var i = height - 1; i > 0; i--) {
							    	var row = '';

							    	for (var j = i; j > 0; j--) 
						  	  		row += " " + emoteP[Math.floor(Math.random()*emoteP.length)];
					  		 		kb.say(channel, row);
								}
							}			
							createPyramid(msgP[0]);
							return "";
						}
						else if (caseChosen[0].case === 'slow' && patternChosen[0].pattern === 'pyramid') {
							function createPyramid (height) {
						  		for (var i = 1; i <= height; i++) {
							    	var row = '';

							    	for (var j = 1; j <= i; j++) 
							      	row += " " + emoteP[Math.floor(Math.random()*emoteP.length)];
						  		  	kb.say(channel, row);
						  		  	sleep(1300);
								}
								for (var i = height - 1; i > 0; i--) {
							    	var row = '';

							    	for (var j = i; j > 0; j--) 
							  	  	row += " " + emoteP[Math.floor(Math.random()*emoteP.length)];
					  		 		kb.say(channel, row);
					  		 		sleep(1300);
								}
							}					
							createPyramid(msgP[0]);
							return "";
						}
						else if (caseChosen[0].case === 'fast' && patternChosen[0].pattern === 'triangle') {
							const randomE = emoteP[Math.floor(Math.random()*emoteP.length)]; 
							function createTriangle (height) {
								for(var i=1; i<=height; i++){
							   		kb.say(channel, (' ' + randomE + ' ').repeat(i))
								}
							}
							createTriangle(msgP[0]);
							return '';
						}
						else if (caseChosen[0].case === 'slow' && patternChosen[0].pattern === 'triangle') {
							const randomE = emoteP[Math.floor(Math.random()*emoteP.length)]; 
							function createTriangle (height) {
								for(var i=1; i<=height; i++){
							   		kb.say(channel, (' ' + randomE + ' ').repeat(i))
							   		sleep(1300);
								}
							}
							createTriangle(msgP[0]);
							return '';
						}
						else if (patternChosen[0].pattern != 'pyramid' && patternChosen[0].pattern != 'triangle') {
							return user['username'] + ', currently supporting only pyramid/triangle.'
						}
					}
				}	
			} catch(err) {
			 	return user['username'] + ", " + err + " FeelsDankMan !!!";
			}	
		}
	},

	{
		name: prefix + "reverse",
		aliases: null,
		description: "syntax: kb reverse [message] | message - reverse given word or sentence - cooldown 5s",
		invocation: async (channel, user, message, args) => {
			try{
				const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(" ").splice(2);
				function reverse(s) { 
					let a = [ ...s ]; a.reverse(); return a.join(''); 
				} 
				if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
       			 	return '';  
	    		} else {   
	     			talkedRecently.add(user['user-id']);
       			 	setTimeout(() => {
          				talkedRecently.delete(user['user-id']);
	            	}, 5000);
	        	}
	        	if (!msg[0]) {
					return user['username'] + ', please provide phrase to reverse :D';
				} else {
					return user['username'] + ", " + reverse(msg.join(" "));
				}
			} catch(err) {
			 	return user['username'] + ", " + err + " FeelsDankMan !!!";
			}
		}
	},

	{
		name: prefix + "locate",
		aliases: prefix + "location",
		description: "syntax: kb locate [IP/message] | IP - provide an IP adress to search for its location | message - provide a non-numeric message to search for its location - cooldown 6s",
		invocation: async (channel, user, message, args) => {
			try{	
				const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(" ").splice(2);	
			 	console.log(msg.join(' ').normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
				function hasNumber(myString) {
				 	return /\d/.test(myString);
				}
				if (talkedRecently.has(user['user-id'])) {
		        	return '';  
			    } else {   
			     	talkedRecently.add(user['user-id']);
            		setTimeout(() => {
	              		talkedRecently.delete(user['user-id']);
	            	}, 6000);
		        }
		        const locate = await fetch("http://api.ipstack.com/" + msg.join(' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '?access_key=' + api.locate)
					.then(response => response.json());

				if (locate.type != null && hasNumber(msg[0])) {
				 	return user['username'] + ", location for " + msg + " => type: " + locate.type + ", country: " + 
				 		locate.country_name + ", region: " + locate.region_name + ", city: " + locate.city + " monkaS";
				}
				else {
					if (!msg[0]) {
						return user['username'] + ", please provide an IP or location to search :)";
					}
					else if (!hasNumber(msg[0]) && msg[0].match(/^\w+$/)) {
						const location = await fetch(api.geonames + msg.join(' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '&maxRows=1&username=kunszg')
						 	.then(response => response.json());
					 	return user['username'] + ', results: ' + location.totalResultsCount + " | location: " + 
						 	location.geonames[0].countryName.replace("ń", "n") + ", " + location.geonames[0].adminName1.replace("ń", "n") + ", " + 
						 	location.geonames[0].name.replace("ń", "n") + " | population: " + location.geonames[0].population + ", info: " + 
						 	location.geonames[0].fcodeName; 
					}
					else if (!msg[0].match(/^\w+$/) && !msg[0].includes('.')) {
						return user['username'] + ', special character detected HONEYDETECTED'
					}
					else {
						return user['username'] + ", could not find given location or location does not exist KKona"; 
					}
				}
			} catch(err) {
				console.log(err);
				if (err.message.includes("read property")) {
					return user['username'] + ", location not found.";
				} else {
					return user['username'] + ", " + err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '') + " FeelsDankMan !!!";
				}
			}	
		}
	},

	{
		name: prefix + "neo",
		aliases: prefix + "asteroid",
		description: "shows information about a random Near Earth Object, that is close to Earth in current day. Data refreshes every 24h - cooldown 5s",
		invocation: async (channel, user, message, args) => {
			try{	
				const today = new Date().toLocaleDateString().split('/');
				const today2 = today[2] + '-' + today[0] + '-' + today[1];
				const neo = await fetch(api.nasa1 + today2 + api.nasa2)
					 .then(response => response.json());
			
			 	const near_earth = Object.entries(neo.near_earth_objects).sort(([a], [b]) => new Date(a) - new Date(b))[0][1];
			 	const random_near_earth = near_earth[Math.floor(Math.random()*near_earth.length)];
			 	const miss = random_near_earth.close_approach_data[0].miss_distance.kilometers;

				if (talkedRecently.has(user['user-id'])) { 
			        return '';      
			    } else {   
			     	talkedRecently.add(user['user-id']);
		            setTimeout(() => {
	              		talkedRecently.delete(user['user-id']);
		            }, 5000);
		        }
			 	return user['username'] + ", near earth objects: " + neo.element_count + " | name: " + random_near_earth.name + 
				 	" | diameter: " + random_near_earth.estimated_diameter.kilometers.estimated_diameter_max.toFixed(3) + "km | miss distance: " + 
				 	Math.trunc(miss+ " ") + "km | is hazardous?: " + random_near_earth.is_potentially_hazardous_asteroid + " | orbiting body: " + 
				 	random_near_earth.close_approach_data[0].orbiting_body;
			} catch(err) {
			 	return user['username'] + ", " + err + " FeelsDankMan !!!";
			}
		}
	},

	{
		name: prefix + "twitter",
		aliases: null,
		description: "syntax: kb twitter [account] | no parameter - returns an error | account - returns latest tweet from specified user - cooldown 8s",
		invocation: async (channel, user, message, args) => {
			try{
				const msg = message.split(" ").splice(2);
				const fetchUrl = require("fetch").fetchUrl;
				const tweet = await new Promise((Resolve, Reject) => {
					fetchUrl(api.twitter + msg[0], function(error, meta, body) { 
					    if (error) {
						   	Reject(error)
					   	}
					    else {
						   	Resolve(body.toString())
					   	}
					})
			  	});
				if (talkedRecently.has(user['user-id'])) { 
			        return '';  	    
			    } else {   
			     	talkedRecently.add(user['user-id']);
		            setTimeout(() => {
		              	talkedRecently.delete(user['user-id']);
		            }, 8000);
		        }
		        if (!msg[0]) {
		        	return user['username'] + ', no account	name provided, see "kb help twitter" for explanation';
		        } else {
					return user['username'] + ", " + tweet.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
				}
			} catch(err) {
			 	return user['username'] + ", " + err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '') + " FeelsDankMan !!!";
			}
		}
	},
			
	{
		name: prefix + "hosts",
		aliases: null,
		invocation: async (channel, user, message, args) => {
			try{
				const msg = message.split(" ").splice(2);
				const hosts = await fetch(api.hosts + msg[0])
					 .then(response => response.json());	
				if (talkedRecently.has(user['user-id'])) { 
	       		 	return '';  
			    } else {   
			     	talkedRecently.add(user['user-id']);
		            setTimeout(() => {
		              	talkedRecently.delete(user['user-id']);
		            }, 8000);
		        }
			    const hostlist = hosts.sort().map(function(e) { return e.replace(/^(.{2})/,"$1\u{E0000}").split("").reverse().join("").replace(/^(.{2})/,"$1\u{E0000}").split("").reverse().join("")}); //character \u{06E4}
		        if (!msg[0]) {
		        	return user['username'] + ", no channel provided.";
		        }
		        else {
		        	if (hosts.length < 25 && hosts.length != 0) {
		        		return user['username'] + ", users hosting " + msg[0].replace(/^(.{2})/,"$1\u{E0000}").split("").reverse().join("").replace(/^(.{2})/,"$1\u{E0000}").split("").reverse().join("") +  " PagChomp 👉  " + hostlist.join(", ");
		        	}
		        	else if (hosts.length > 25) {
		        		return user['username'] + ", channel " + msg[0].replace(/^(.{2})/,"$1\u{E0000}").split("").reverse().join("").replace(/^(.{2})/,"$1\u{E0000}").split("").reverse().join("") + " is being hosted by " + hosts.length + " users";
		        	}
		        	else if (hosts.length === 0) {
		        		return user['username'] + ", channel is not being hosted by any user :("
		        	}
		        	else {
		        		return user['username'] + ", something fucked up eShrug";
		        	}
		        }
	        } catch(err) {
	        	const msg = message.split(" ").splice(2);
        		const fetchUrl = require("fetch").fetchUrl;
				const foo = await new Promise((Resolve, Reject) => {
					fetchUrl(api.hosts + msg[0], function(error, meta, body) { 
					    if (error) {
						   	Reject(error)
					   }
					    else {
						   	Resolve(body.toString())
					   }
					})
		  		});
        		return user['username'] + ", " + foo
			}
		}
	},

	{
		name: prefix + "bttv",
		aliases: null,
		invocation: async (channel, user, message, args) => {
			try{
				const fetchUrl = require("fetch").fetchUrl;
				const bttv = await new Promise((Resolve, Reject) => {
					fetchUrl(api.bttv + channel.substring(1), function(error, meta, body){ 
					    if (error) {
						   	Reject(error)
					   	}
					    else {
						   	Resolve(body.toString())
					   	}
					})
			  	});
				if (talkedRecently.has(user['user-id'])) { 
		        	return '';  
			    } else {   
			     	talkedRecently.add(user['user-id']);
		            setTimeout(() => {
		              	talkedRecently.delete(user['user-id']);
		            }, 30000);
		        }
				if (channel === '#nymn') {
					return user['username'] + ', I cannot display BTTV emotes in this channel :('
				}
				else {	 
					return user['username'] + ", " + bttv; 
				}
			} catch(err) {
			 	return user['username'] + ", " + err + " FeelsDankMan !!!";
			}
		}
	},

	{
		name: prefix + "rp",
		aliases: prefix + "randomplaysound",
		permission: 'restricted',
		invocation: async (channel, user, message, args) => {
			try{
				const playsound = await fetch("https://supinic.com/api/bot/playsound/list")
					 .then(response => response.json());
		 		const randomPs = playsound.data.playsounds[Math.floor(Math.random()*playsound.data.playsounds.length)]
	        	if (channel === "#supinic") {
		        	if (talkedRecently.has(user['user-id'])) { 
			        	return '';  
				    } else {   
				     	talkedRecently.add(user['user-id']);
		           	 	setTimeout(() => {
		             		talkedRecently.delete(user['user-id']);
			            }, 5000);
			        }
			  		return '$ps ' + randomPs.name;
			  	}
			  	else {
			  		return "";
			  	}
		  	} catch(err) {
			 	return user['username'] + ", " + err + " FeelsDankMan !!!";
			}
		} 
	},

	{
		name: prefix + '4Head',
		aliases: prefix + '4head',
		invocation: async (channel, user, message, args) => {
			try{
				const arr = [
					'general',
					'general',
					'general',
					'general',
					'general',
					'programming',
					'programming'
				];
				function firstLettertoLowerCase(string) {
					return string.charAt(0).toLowerCase() + string.slice(1);
				}

		 		if (talkedRecently.has(user['user-id'])) { 
			        return '';  
			    } else {   
			     	talkedRecently.add(user['user-id']);
	            	setTimeout(() => {
		              	talkedRecently.delete(user['user-id']);
		            }, 4000);
		        }

				const randomPs = arr[Math.floor(Math.random()*arr.length)];

				if (randomPs === 'programming') {
					const joke = await fetch(api.joke1)
			 			.then(response => response.json()); 

		 			setTimeout(() => { 
		 				kb.say(channel, firstLettertoLowerCase(joke[0].punchline.replace(/\./g, '')) + ' 4HEad '
	 				)}, 3000);
		 			return user['username'] + ', ' + firstLettertoLowerCase(joke[0].setup);
		 		}
		 		else if (randomPs === 'general') {
		 			const jokeGeneral = await fetch(api.joke2) 
			 			.then(response => response.json()); 

		 			setTimeout(() => { 
		 				kb.say(channel, firstLettertoLowerCase(jokeGeneral.punchline.replace(/\./g, '')) + ' 4HEad '
	 				)}, 3000);
		 			return user['username'] + ', ' + firstLettertoLowerCase(jokeGeneral.setup);
		 		}
	 		} catch(err) {
				console.log(err);
				return user['username'] + err + ' FeelsDankMan !!!';
			}
		}
	},

	{
		name: prefix + "rl",
		aliases: prefix + "randomline",
		invocation: async (channel, user, message, args) => {
			try{
				const msg = message.split(' ').splice(2);
				if (talkedRecently.has(user['user-id'])) { 
					return ''; 
				} else {
					talkedRecently.add(user['user-id']);
					setTimeout(() => {
						talkedRecently.delete(user['user-id']);
					}, 2000);
				}
				function format(seconds){
					function pad(s){
						return (s < 10 ? '0' : '') + s;
					}
					var hours = Math.floor(seconds / (60*60));
					var minutes = Math.floor(seconds % (60*60) / 60);
					var seconds = Math.floor(seconds % 60);
					if (hours === 0 && minutes != 0) {
						return minutes + 'm ' + seconds + "s";
					} else {
						if (minutes === 0 && hours === 0) {
							return seconds + "s"
						} else {
							return hours + 'h ' + minutes + 'm ' + seconds + "s"; 
						}
					}
				}
				if (channel === '#nymn') {
					con.query('SELECT ID, username, message, date FROM logs_nymn ORDER BY RAND() LIMIT 1', function (error, results, fields) {
						if (error) {
							con.query('INSERT INTO error_logs (error_message, date) VALUES ("' + error + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
								if (error) {
									console.log(error);
									throw error;
								}
							})
						} else {
							const serverDate = new Date().getTime();
							const messageDate = results[0].date;
							const timeDifference = Math.abs(serverDate - (new Date(messageDate).getTime()))
							if (timeDifference/1000/3600 > 48) {
								kb.say(channel, '(' + timeDifference/1000/3600/24 + 'd ago) ' + results[0].username + ': ' + results[0].message.replace(/\?/g, ''))
							} else {
								kb.say(channel, '(' + format(timeDifference/1000) + ' ago) ' + results[0].username + ': ' + results[0].message.replace(/\?/g, ''))
							}
						}
					})
				} else if (channel === '#haxk') {
					con.query('SELECT ID, username, message, date FROM logs_haxk ORDER BY RAND() LIMIT 1', function (error, results, fields) {
						if (error) {
							con.query('INSERT INTO error_logs (error_message, date) VALUES ("' + error + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
								if (error) {
									console.log(error);
									throw error;
								}
							})
						} else {
							const serverDate = new Date().getTime();
							const messageDate = results[0].date;
							const timeDifference = Math.abs(serverDate - (new Date(messageDate).getTime()))
							if (timeDifference/1000/3600 > 48) {
								kb.say(channel, '(' + timeDifference/1000/3600/24 + 'd ago) ' + results[0].username + ': ' + results[0].message.replace(/\?/g, ''))
							} else {
								kb.say(channel, '(' + format(timeDifference/1000) + ' ago) ' + results[0].username + ': ' + results[0].message.replace(/\?/g, ''))
							}
						}
					})
				} else if (channel === '#supinic') {
					con.query('SELECT ID, username, message, date FROM logs_supinic ORDER BY RAND() LIMIT 1', function (error, results, fields) {
						if (error) {
							con.query('INSERT INTO error_logs (error_message, date) VALUES ("' + error + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
								if (error) {
									console.log(error);
									throw error;
								}
							})
						} else {
							const serverDate = new Date().getTime();
							const messageDate = results[0].date;
							const timeDifference = Math.abs(serverDate - (new Date(messageDate).getTime()))
							if (timeDifference/1000/3600 > 48) {
								kb.say(channel, '(' + timeDifference/1000/3600/24 + 'd ago) ' + results[0].username + ': ' + results[0].message.replace(/\?/g, ''))
							} else {
								kb.say(channel, '(' + format(timeDifference/1000) + ' ago) ' + results[0].username + ': ' + results[0].message.replace(/\?/g, ''))
							}
						}
					})
				} else {
					return '';
				}
				return '';
			} catch(err) {
				console.log(err);
				return user['username'] + err + ' FeelsDankMan !!!';
			}		
		}
	},

	{
		name: prefix + 'bots',
		aliases: prefix + 'bot',
		invocation: async (channel, user, message, args) => {
			try{
				const dateMinute = new Date().getMinutes()
				const time = await fetch("https://supinic.com/api/bot/active")
	 			.then(response => response.json());	

				if (talkedRecently.has(user['user-id'])) { 
			        return ''; 
		    	} else {
				  	talkedRecently.add(user['user-id']);
	            	setTimeout(() => {
		              	talkedRecently.delete(user['user-id']);
		            }, 3000);
		        }
	 			if (time.data.filter(i => i.lastSeenTimestamp != null)) {
			      	function format(seconds){
				        function pad(s){
				        	return (s < 10 ? '0' : '') + s;
						}
				        var hours = Math.floor(seconds / (60*60));
				        var minutes = Math.floor(seconds % (60*60) / 60);
				        var seconds = Math.floor(seconds % 60);
				        if (hours === 0 && minutes != 0) {
				        	return minutes + 'm ago';
				        } else {
				        	if (minutes === 0 && hours === 0) {
				        		return seconds + "s ago"
				        	}
				        	else if (seconds === 0 || hours === 0 && minutes === 0) {
					        		return 'just now'
				        	}
				        	else {
				        		return hours + 'h ago'
				        	}
				        }
				    } 
	 				const bots = time.data.filter(i => i.lastSeenTimestamp != null).map(
	 					i => ' ' + i.name + ' ' + format(
	 						(Math.abs(new Date() - new Date(i.lastSeenTimestamp)))/1000)
	 					);
						return user['username'] + ', active known bots MrDestructoid 👉' + bots;
	 			}
			} catch(err) {
				console.log(err);
				return user['username'] + err + ' FeelsDankMan !!!';
			}
		}
	},
		
	{
		name: prefix + 'PepeLaugh',
		aliases: prefix + 'pepelaugh',
		invocation: async (channel, user, message, args) => {
			try{
				const { readdirSync } = require('fs')
				const getDirectories = source =>
				  	readdirSync('./node_modules', { withFileTypes: true })
			    		.filter(dirent => dirent.isDirectory())
				    	.map(dirent => dirent.name)
				return user['username'] + ', my node_modules directory has ' + getDirectories().length + ' modules PepeLaugh'; 	
			} catch(err) {
				console.log(err);
				return user['username'] + err + ' FeelsDankMan !!!';
			}
		}
	},

	{
      	name: prefix + "dank",
      	aliases: null,
      	invocation: async (channel, user, message, args) => {
      		try{
	        	const msg = message.split(" ").splice(2);
		    
			    if (talkedRecently2.has(user['user-id'])) { //if set has user id - ignore
					return '';  	    
				} else {   
		    		talkedRecently2.add(user['user-id']);
	            	setTimeout(() => {
	         			talkedRecently2.delete(user['user-id']);
		            }, 2000);
		        }
	        
	        	if (!msg.join(' ').replace(/[\u{E0000}|\u{206d}]/gu, '')) {
	        		return user['username'] + ", FeelsDankMan oh zoinks, you just got flippin' danked by yourself FeelsDankMan FeelsDankMan FeelsDankMan";
	      		} else {
		        	return user['username'] + ", you just danked " + msg.join(' ') + " FeelsDankMan 👍";
				}
     		} catch(err) {
				console.log(err);
				return user['username'] + err + ' FeelsDankMan !!!';
			}
     	}
    },

	{
		name: prefix + "help",
		aliases: null,
		description: "syntax: kb help [command] | no parameter - shows basic information about bot, it's owner and host | command - shows description of a specified command - cooldown 5s",
		invocation: async (channel, user, message, args) => {
			try {
				const msg = message.toLowerCase().split(' ').splice(2);
				if (talkedRecently2.has(user['user-id'])) {
					return '';  				    
				} else {   
					talkedRecently2.add(user['user-id']);
					setTimeout(() => {
						talkedRecently2.delete(user['user-id']);
					}, 5000);
				}

				// if there is no parameter given, return basic command message
				if (!msg[0]) {
					return user['username'] + ", kunszgbot is owned by KUNszg, sponsored by " + "Sinris".replace(/^(.{2})/,"$1\u{E0000}") + " , Node JS " + process.version + 
							", running on Ionos VPS, Debian 9 GNU/" + process.platform + ' ' + process.arch + ", for commands list use 'kb commands'.";

				} else if (commands.filter(i => i.name.substring(3).toLowerCase() === msg[0])) {
					// filter for command names matching the given parameter
					if (commands.filter(i => i.name.substring(3).toLowerCase() === msg[0]) && commands.filter(i=>i.name.substring(3).toLowerCase() === msg[0]).length != 0) {
						// if there is a specified command and the description exists - respond
						return user['username'] + ', ' + commands.filter((i=>i.name.substring(3).toLowerCase() === msg[0])).map(i=>i.description)[0];		
					} else if (commands.filter(i => i.name.substring(3).toLowerCase() === msg[0]) && commands.filter(i=>i.name.substring(3).toLowerCase() === msg[0]).length === 0) {
						// if specified command does not exist, throw an error
						throw 'command does not exist.';
					} else if (!(commands.filter((i => i.name.substring(3).toLowerCase() === msg[0])).map(i=>i.description))){
						// if specified command exists but there is no description for it, throw an error
						throw 'description for that command does not exist.'
					}
				} else {
					// if something else that is not handled happens, throw an error
					throw 'internal error monkaS';
				}
			} catch(err) {
				console.log(err);
				// return the thrown error to chat
				return user['username'] +', ' + err + ' ';
			}
		}
	},

    {
    	name: prefix + "joemama",
    	aliases: prefix + "mama",
    	invocation: async (channel, user, message, args) => {
			try { 
	    		if (talkedRecently2.has(user['user-id'])) {
					return '';  				    
				} else {   
		     		talkedRecently2.add(user['user-id']);
	            	setTimeout(() => {
	         			talkedRecently2.delete(user['user-id']);
		            }, 5000);
		        }
	    		const fetchUrl = require("fetch").fetchUrl;
				const joemama = await new Promise((Resolve, Reject) => {
					fetchUrl(api.joemama, function(error, meta, body) {
					    if (error) {
					    	console.log(error);
						   	Reject(error)
					   	}
					    else {
						   	Resolve(body.toString())
					   	}
					})
			  	});
			  	const laughingEmotes = [ 
			  		' 😬',
			  		' 4Head',
			  		' 4HEad',
			  		' ArgieB8',
			  		' FreakinStinkin',
			  		' AlienPls',
			  		' 🔥',
			  		' FireSpeed',
			  		' ConcernDoge',
			  		' haHAA',
			  		' CruW',
			  		' :O',
			  		' >(',
			  		' OMEGALUL',
			  		' LULW',
			  		' CurseLit',
			  		' 😂'
			  	]
			  	const emotesJoke = laughingEmotes[Math.floor(Math.random()*laughingEmotes.length)]
			  	function firstLettertoLowerCase(string) {
					return string.charAt(0).toLowerCase() + string.slice(1);
				}
				return user['username'] + ', ' + firstLettertoLowerCase(joemama.split('"')[3]) + emotesJoke;
    		} catch(err) {
				console.log(err);
				return user['username'] + err + ' FeelsDankMan !!!';
			}
    	}
    },
	
	{
		name: prefix + "restart",
		aliases: null,
		permission: 'restricted',
		invocation: async (channel, user, message, args) => {
			try {
				const perms = allowEval.filter(
					i => i.ID === user['user-id']
				);

				if (!perms[0]) {
					return "";
				} else {
					const shell = require('child_process');
					kb.say(channel, 'pulling from @master PogChamp 👉 ' + await shell.execSync('git pull').toString().replace(/-{2,}/g, "").replace(/\+{2,}/g, "")) //pull from github
					
					setTimeout(()=>{kb.say(channel, 'restarting Okayga ')}, 6000);
					setTimeout(()=>{process.kill(process.pid)}, 10000);
					return '';
				}
			} catch (err) {
				console.log(err);
				return user['username'] + err + ' FeelsDankMan !!!';
			}
		}
	}, 

	{
		name: prefix + 'github',
		aliases: prefix + 'git',
		invocation: async (channel, user, message, args) => {
			try {
		        const commits = await fetch('https://api.github.com/repos/KUNszg/kbot/commits')
			 		.then(response => response.json());
			 	const commitDate = new Date(commits[0].commit.committer.date);
			 	const serverDate = new Date();
			 	const diff = Math.abs(commitDate-serverDate)
		      	const DifftoSeconds = (diff / 1000).toFixed(2);
		      	if (talkedRecently2.has(user['user-id'])) { //if set has user id - ignore
					return '';  				    
				} else {   
		     		talkedRecently2.add(user['user-id']);
	            	setTimeout(() => {
	         			talkedRecently2.delete(user['user-id']);
		            }, 5000);
		        }
		      	function format(seconds){
			        function pad(s){
			        	return (s < 10 ? '0' : '') + s;
					}
			        var hours = Math.floor(seconds / (60*60));
			        var minutes = Math.floor(seconds % (60*60) / 60);
			        var seconds = Math.floor(seconds % 60);
			        if (hours === 0 && minutes != 0) {
			        	return minutes + 'm ' + seconds + "s";
			        } else {
			        	if (minutes === 0 && hours === 0) {
			        		return seconds + "s"
			        	}
			        	else if (seconds === 0 || hours === 0 && minutes === 0) {
			        		return 'just now!'
			        	}
			        	else {
			        		return hours + 'h ' + minutes + 'm ' + seconds + "s"; 
			        	}
			        }
			    } 
		        return user['username']  + ', my public repo Okayga 👉 https://github.com/KUNszg/kbot last commit: ' + format(DifftoSeconds) + ' ago';
	        } catch(err) {
				console.log(err);
				return user['username'] + ', ' + err + ' FeelsDankMan !!!';
			}
		}
	},

	{
		name: prefix + 'suggest',
		aliases: null,
		invocation: async (channel, user, message, args) => {
			try {
				const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2)
				if (talkedRecently.has(user['user-id'])) { 
					return '';
				} else {   
					talkedRecently.add(user['user-id']);
					setTimeout(() => {
						talkedRecently.delete(user['user-id']);
					}, 8000);
				}
				if (!msg[0]) {
					return user['username'] + ', no message provided FeelsDankMan';
				} else if ((/^[\x00-\x7F]+$/.test(msg.join(' '))) === false) {
					return user['username'] + ', special character detected HONEYDETECTED';
				} else {
					const query = await new Promise((Reject, Resolve) => {
						con.query('SELECT message FROM suggestions WHERE message="' + msg.join(' ') + '"', function (error, results, fields) {
							if (error) { 
								kb.say(channel, user['username'] + ', error occured xD');
								return;
							}
							if (results.length === 0) {
								con.query('INSERT INTO suggestions (username, message, created) VALUES ("' + user['username'] + '", "' + msg.join(' ') + '", CURRENT_TIMESTAMP)' , function (error, results, fields) {
									if (error) {
										kb.say(channel, user['username'] + ', error occured xD');
										return;
									}
									con.query('SELECT ID FROM suggestions WHERE message="' + msg.join(' ') + '"', function (error, results, fields) {
										if (error) {
											kb.say(channel, user['username'] + ', error occured xD');
											return;
										}
										Resolve(user['username'] + ', suggestion saved with ID ' + results[0].ID + ' PogChamp');
									})
								})
							} else {
								Resolve(user['username'] + ", duplicate suggestion.");
							}
						})
					})
					return query;
				}
			} catch(returnValue) {
				return returnValue;
			}
		}
	},

	{
		name: prefix + 'check',
		aliases: null,
		permission: 'restricted',
		invocation: async (channel, user, message, args) => {
			try {
				const msg = message.split(' ')[2];
				const perms = allowEval.filter(
					i => i.ID === user['user-id']
				);
				if (!perms[0]) {
					return "";
				} else {
					const query = await new Promise((Reject, Resolve) => {
						con.query('SELECT ID, message, username, status FROM suggestions WHERE ID="' + msg + '"' , function (error, results, fields) {
							if (error) {
								Reject(user['username'] + ', error xD 👉 ' + error);
							} else {
								if (!results[0].ID) {
									Resolve(user['username'] + ', such ID does not exist FeelsDankMan');
								} else if (results[0].ID === msg) {
									Resolve('from' + results[0].username + ': ' + results[0].message + ' | status: ' + results[0].status);
								} else {
									Resolve('from ' + results[0].username + ': ' + results[0].message + ' | status: ' + results[0].status);
								}
							}
						})
					})
					return query;
				}
			} catch(returnValue) {
				return returnValue;
			}
		}
	},

	{
		name: prefix + 'supee',
		aliases: prefix + 'sp',
		permission: 'restricted',
		invocation: async (channel, user, message, args) => {
			try {
				if (talkedRecently.has('supee')) { 
	       		 	return '';  
			    } else {   
			     	talkedRecently.add('supee');
		            setTimeout(() => {
		              	talkedRecently.delete('supee');
		            }, 30000);
		        }
				if (channel != '#supinic') {
					return ''
				} else {
					let amount = 0;
					fs.appendFileSync('./db/supee.js', ' "' + amount++ + '", ')
					return user['username'] + ', supi went to toilet ' + fs.readFileSync('./db/supee.js').toString().split('",').length-1 + ' times peepoSadDank 💦'
				}
			} catch(err) {
				return user['username'] + ', ' + err + ' FeelsDankMan !!!';
			}
		}
	},

	{
		name: prefix + 'cookie',
		aliases: null,
		description: 'after "kb cookie" type register/unregister to register or unregister from the database, type status for your rank info. Supported cookie reminder ranks: default (2h), p1 (1h), p2 (30m), p3 (20m), to set a rank type for eg.:"kb cookie p1" - cooldown 10s',
		invocation: async (channel, user, message, args) => {
			try {
				const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2);
				if (talkedRecently.has(user['user-id'])) { 
	       		 	return '';  
			    } else {   
			     	talkedRecently.add(user['user-id']);
		            setTimeout(() => {
		              	talkedRecently.delete(user['user-id']);
		            }, 8000);
		        }
				switch (msg[0]) {
					case 'module':
						if (user['user-id'] != '178087241') {
							return '';
						} else {
							con.query('UPDATE cookieModule SET reminders="' + msg[1] + '"', function (error, results, fields) { 
								if (error) {
									kb.say(channel, ' error eShrug')
								} else {
									kb.say(channel, 'updated to ' + msg[1])
								}
							})
						}
						break;
					case 'force':
						const cookieApi = await fetch('https://api.roaringiron.com/cooldown/' + user['username'])
		 					.then(response => response.json());
		 				if (cookieApi.interval_unformatted === 3600) {
		 					return '$remind ' + user['username'] + ' eat cookie in 3630s';
		 				} else if (cookieApi.interval_unformatted === 7200) {
		 					return '$remind ' + user['username'] + ' eat cookie in 7230s';
		 				} else if (cookieApi.interval_unformatted === 1800) {
		 					return '$remind ' + user['username'] + ' eat cookie in 1830s';
		 				} else if (cookieApi.interval_unformatted === 1200) {
		 					return '$remind ' + user['username'] + ' eat cookie in 1230s';
		 				} else {
		 					return user['username'] + ' error WutFace';
		 				}
		 				break;
					case 'register':
						con.query('SELECT username FROM cookies WHERE username="' + user['username'] + '"', function (error, results, fields) {
							if (error) throw error;
							if (results.length === 0 || results[0].username === 0) {
								kb.say(channel, user['username'] + ', you have been successfully registered for a default reminder, if you are a prestige rank see "kb help cookie" for command syntax.');
								con.query('INSERT INTO cookies (username, rank, created) VALUES ("' + user['username'] + '", "default_rank", CURRENT_TIMESTAMP)', function (error, results, fields) {
									if (error) throw error;
								})
							} else if (results[0].username === user['username']) {
								kb.say(channel, user['username'] + ', you are already registered for cookie reminders, type "kb help cookie" for command syntax.');
							} else {
								return '';
							}
						})
						break;
					case 'unregister':
						con.query('SELECT username FROM cookies WHERE username="' + user['username'] + '"', function (error, results, fields) {
							if (error) throw error;
							if (results != 0) {
								con.query('DELETE FROM cookies WHERE username="' + user['username'] + '"' , function (error, results, fields) {
									if (error) throw error;
									kb.say(channel, user['username'] + ', you are no longer registered for a cookie reminder.');
								})
							} else {
								kb.say(channel, user['username'] + ", you are not registered for a cookie reminder, therefore you can't be unregistered FeelsDankMan");
							}
						})
						break;
					case 'status':
						const cookieStatus = await fetch('https://api.roaringiron.com/cooldown/' + user['user-id'] + '?id=true')
				 			.then(response => response.json());
			 			const cookiesEaten = await fetch('https://api.roaringiron.com/user/' + user['user-id'] + '?id=true')
				 			.then(response => response.json());
						con.query('SELECT username FROM cookies WHERE username="' + user['username'] + '"', function (error, results, fields) {
							if (error) throw error;
							if (results.length === 0) {
								kb.say(channel, user['username'] + ', you are not registered in the database, type "kb help cookie" for command syntax.');
							} else {
								con.query('SELECT username, rank, created FROM cookies WHERE username="' + user['username'] + '"', function (error, results, fields) { 
									if (error) {
										throw error
									} else {
										kb.say(channel, user['username'] + ', Your current reminder rank is ' + results[0].rank + ' (' + cookiesEaten.rank + ') - time left until next cookie: ' + cookieStatus.time_left_unformatted + ' - cookies: ' + cookiesEaten.cookies);
									}
								})
							}
						})
						break;
					case 'p1':
						con.query('SELECT username FROM cookies WHERE username="' + user['username'] + '"', function (error, results, fields) {
							if (error) throw error;
							if (results.length === 0) {
								kb.say(channel, user['username'] + ', you are not registered in the database, type "kb help cookie" for command syntax.');
							} else {
								con.query('UPDATE cookies SET rank="p1", updated=CURRENT_TIMESTAMP WHERE username="' + user['username'] + '"', function (error, results, fields) { 
									if (error) {
										throw error
									} else {
										kb.say(channel, user['username'] + ', your cookie reminder rank is now set to prestige 1 (timer: 1h) KKona');
									}
								})
							}
						})
						break;
					case 'p2':
						con.query('SELECT username FROM cookies WHERE username="' + user['username'] + '"', function (error, results, fields) {
							if (error) throw error;
							if (results.length === 0) {
								kb.say(channel, user['username'] + ', you are not registered in the database, type "kb help cookie" for command syntax.');
							} else {
								con.query('UPDATE cookies SET rank="p2", updated=CURRENT_TIMESTAMP WHERE username="' + user['username'] +'"', function (error, results, fields) {
									if (error) {
										throw error
									} else {
										kb.say(channel, user['username'] + ', your cookie reminder rank is now set to prestige 2 (timer: 30m) KKona');
									}
								})
							}
						})
						break;
					case 'p3':
						con.query('SELECT username FROM cookies WHERE username="' + user['username'] + '"', function (error, results, fields) {
							if (error) throw error;
							if (results.length === 0) {
								kb.say(channel, user['username'] + ', you are not registered in the database, type "kb help cookie" for command syntax.');
							} else {
								con.query('UPDATE cookies SET rank="p3", updated=CURRENT_TIMESTAMP WHERE username="' + user['username'] + '"', function (error, results, fields) { 
									if (error) {
										throw error
									} else {
										kb.say(channel, user['username'] + ', your cookie reminder rank is now set to prestige 3 (timer: 20m) KKona');
									}
								})
							}
						})
						break;
					case 'p4':
						con.query('SELECT username FROM cookies WHERE username="' + user['username'] + '"', function (error, results, fields) {
							if (error) throw error;
							if (results.length === 0) {
								kb.say(channel, user['username'] + ', you are not registered in the database, type "kb help cookie" for command syntax.');
							} else {
								con.query('UPDATE cookies SET rank="p4", updated=CURRENT_TIMESTAMP WHERE username="' + user['username'] + '"', function (error, results, fields) {
									if (error) {
										throw error
									} else {
										kb.say(channel, user['username'] + ', your cookie reminder rank is now set to prestige 4 (rank not available yet)');
									}
								})
							}
						})
						break;
					case 'p5':
						con.query('SELECT username FROM cookies WHERE username="' + user['username'] + '"', function (error, results, fields) {
							if (error) throw error;
							if (results.length === 0) {
								kb.say(channel, user['username'] + ', you are not registered in the database, type "kb help cookie" for command syntax.');
							} else {
								con.query('UPDATE cookies SET rank="p5", updated=CURRENT_TIMESTAMP WHERE username="' + user['username'] + '"', function (error, results, fields) { 
									if (error) {
										throw error
									} else {
										kb.say(channel, user['username'] + ', your cookie reminder rank is now set to prestige 5 (rank not available yet)');
									}
								})
							}
						})
						break;
					case 'default':
						con.query('SELECT username FROM cookies WHERE username="' + user['username'] + '"', function (error, results, fields) {
							if (error) throw error;
							if (results.length === 0) {
								kb.say(channel, user['username'] + ', you are not registered in the database, type "kb help cookie" for command syntax.');
							} else {
								con.query('UPDATE cookies SET rank="default_rank", updated=CURRENT_TIMESTAMP WHERE username="' + user['username'] + '"', function (error, results, fields) { 
									if (error) {
										throw error
									} else {
										kb.say(channel, user['username'] + ', your cookie reminder rank is now set to default (timer: 2h)  ppHop');
									}
								})
							}
						})
						break;
					default:
						return user['username'] + ', invalid syntax. See "kb help cookie" for command help.';
				}
				return '';
			} catch(err) {
				return user['username'] + ', ' + err + ' FeelsDankMan !!!';
			}
		}
	},

	{
		name: prefix + "commands",
		aliases: null,
		invocation: async (channel, user, message, args) => {
			return '';
		}
	},
];

kb.on("chat", async (channel, user, message, self) => {
	const input = message.split(' ') 
	if (user['user-id'] === "441611405") return;
	if (user['user-id'] === "81613973") return;
	if (self) return;

	commands.forEach(async command => {
		if (
		    ((input[0].replace('kbot', 'kb') + ' ' + input[1]).replace(/,/, '').replace('@', '').toLowerCase() === command.name) ||
		    (command.aliases && (input[0].replace('kbot', 'kb') + ' ' + input[1]).replace(/,/, '').replace('@', '').toLowerCase() === command.aliases)
		  ) {
		    let result = await command.invocation(channel, user, message);
			if (!result) {
				kb.say(channel, '');
				return;
			}
    		if (repeatedMessages[channel] === result) {
	      		result += " \u{E0000}";
	    	}		
		    repeatedMessages[channel] = result;

		    const colorList = [
			     "Blue", "BlueViolet", "CadetBlue", "Chocolate", 
			     "Coral", "DodgerBlue", "Firebrick", "GoldenRod", 
			     "Green", "HotPink", "OrangeRed", "Red", "SeaGreen", 
			     "SpringGreen", "YellowGreen" 
		    ];
		    
		    const colors = colorList[Math.floor(Math.random()*colorList.length)]
			kb.say(channel, "/color " + colors);
			
			async function sendResponse() {
				const test = (await fetch('https://nymn.pajbot.com/api/v1/banphrases/test', { 
					method: "POST",
					url: "https://nymn.pajbot.com/api/v1/banphrases/test",
					body: "message=" + result,
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
						},
				}).then(response => response.json()))
				if (channel === '#nymn') {
					if (test.banned === true) {	
						kb.say(channel, user['username'] + ', the result is banphrased, I whispered it to you tho cmonBruh')
		    			kb.whisper(user['username'], result);
		    			return;
					} else {
						if (!result) {
					    	kb.say(channel, "");
					    } else { 
					    	if (result.replace(/[\u{E0000}|\u{206d}]/gu, '') === "undefined") {
					    		kb.say(channel, 'Internal error monkaS')
					    		return;
					    	}
							else if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
								kb.say(channel, user['username'] + ', TriHard oauth key');
								return;
							}
							else if (result.toLowerCase() === 'object') {
								if (channel === '#nymn') {
									kb.say(channel, ' object peepoSquad')
									return;
								} else {
									kb.say(channel, ' object 🦍')
									return;
								}
							} else {
								commandsExecuted.push('1');
							 	kb.say(channel, result);
							}				
			 			}
					}
				} else {
					if (!result) {
					    	kb.say(channel, "");
					    } else { 
					    	if (result.replace(/[\u{E0000}|\u{206d}]/gu, '') === "undefined") {
					    		kb.say(channel, 'Internal error monkaS')
					    		return;
					    	}
							else if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
								kb.say(channel, user['username'] + ', TriHard oauth key');
								return;
							}
							else if (result.toLowerCase() === 'object') {
								if (channel === '#nymn') {
									kb.say(channel, ' object peepoSquad')
									return;
								} else {
									kb.say(channel, ' object 🦍')
									return;
								}
							} else {
								commandsExecuted.push('1');
					 			kb.say(channel, result);
							}				
			 			}	
					}
				}
				sendResponse()
	 		}	
		});
	});
const talkedRecently3 = new Set();
const commandlist = [
    {
      name: prefix + "commands",
      aliases: null,
      invocation: (channel, user, args) => {
		try{
	      	const trackObj = commands.filter(
				i => i.name && i.permission != 'restricted'
				);
	      	const xd = trackObj.map(
	      		i => i.name
	      		);
	      	const xdd = ((xd.sort().toString().replace(/,/g, " | ").replace(/kb/g, '') + " |").split('|')).length;
	    		
	  	  	if (talkedRecently3.has(user['user-id'])) { //if set has user id - ignore
				return '';  	    
			} else {   
		     talkedRecently3.add(user['user-id']);
	            setTimeout(() => {
	              // removes the user from the set after 10s
         			talkedRecently3.delete(user['user-id']);
	            }, 10000);
	        }
	        const xddd = xdd - 1
	        return user['username'] + ", " + xddd + " active commands PogChamp 👉 (prefix: kb) | " + 
	        	xd.sort().toString().replace(/,/g, " | ").replace(/kb/g, '') + " |".split(' | ')
	     	
     		} catch(err) {
				return user['username'] + ", " + err + " FeelsDankMan !!!";
			}
     	}
    },
];

kb.on("chat", async (channel, user, message, self) => { 
	const input = message.split(' ') 
    if (user['user-id'] === "441611405") return;
    if (user['user-id'] === "81613973") return;
    if (user['user-id'] === "249408349") return;
  	if (self) return;
    commandlist.forEach(async command => {
		if (
		    ((input[0].replace('kbot', 'kb') + ' ' + input[1]).replace(/,/, '').replace('@', '').toLowerCase() === command.name) ||
		    (command.aliases && (input[0].replace('kbot', 'kb') + ' ' + input[1]).replace(/,/, '').replace('@', '').toLowerCase() === command.aliases)
		  ) {
   		let result = await command.invocation(channel, user, message);

      // If a message would be duplicated in a row in a channel, add something to make it not duplicate
      	if (repeatedMessages[channel] === result) {
        	result += " \u{E0000}";
      	}

      	repeatedMessages[channel] = result;
      	commandsExecuted.push('1');
		kb.say(channel, result);
      	  	               
        }
    })
})
const pingAmount = [];
async function sendOnlineStatus() {	
	pingAmount.push('ping')
	const test = (await fetch(api.supinic, {
	    method: 'PUT',
		}).then(response => response.json()))
	console.log(test)
}	
setInterval(() => {sendOnlineStatus()}, 600000);

const dankPrefix = '?';
const talkedRecently2 = new Set();
const dankeval = [
	{
		name: 'HONEYDETECTED',
		aliases: null,
		invocation: async (channel, user, message, args) => {
			if (user['user-id'] != '68136884') {
				return '';
			}
			else {
				return 'HONEYDETECTED POŁĄCZONO PONOWNIE KKurwa 7';
			} 
		}
	},

    {
		name: dankPrefix + 'cookie',
		aliases: null,
		permission: 'restricted',
		invocation: async (channel, user, args) => {
			try {
				if (talkedRecently.has(user['user-id'])) { 
	       		 	return '';  
			    } else {   
			     	talkedRecently.add(user['user-id']);
		            setTimeout(() => {
		              	talkedRecently.delete(user['user-id']);
		            }, 18000);
		        }
		        const cookieApi = await fetch('https://api.roaringiron.com/cooldown/' + user['username'])
		 			.then(response => response.json());
		 		con.query('SELECT reminders FROM cookieModule', function (error, results, fields) {
		 			console.log(results)
		 			if (results[0].reminders === false) {
		 				kb.say(channel, '');
		 				return;
		 			} else {
		 				async function respo() {
					        const query = await new Promise((Reject, Resolve) => {
								con.query('SELECT username, rank FROM cookies WHERE username="' + user['username'] + '"', function (error, results, fields) {
									if (error) {
										Reject('kunszg', '@kunszg cookie error: ' + error)
									} else {
										if (results.length === 0) {
											kb.say(channel, '');
										} else {
											if (results[0].rank === 'p1') {
												if (cookieApi.seconds_left<3580) {
													kb.whisper(user['username'] + ' your cookie is still on cooldown (' + cookieApi.time_left_formatted + '), wait 1h intervals. To force your cookie reminder do "kb cookie force" in chat.');
												} else {
													kb.say(channel, '$remind ' + results[0].username + ' eat cookie :) in 1h');
													con.query('UPDATE cookies SET last_executed=CURRENT_TIMESTAMP WHERE username="' + user['username'] + '"', function (error, results, fields) {
														if (error) {
															kb.say(channel, user['username'] + ", database error LUL")
														}
													})
												}
											} else if (results[0].rank === 'p2') {
												if (cookieApi.seconds_left<1780) {
													kb.whisper(user['username'] + ' your cookie is still on cooldown (' + cookieApi.time_left_formatted + '), wait 30m intervals. To force your cookie reminder do "kb cookie force" in chat.');
												} else {
													kb.say(channel, '$remind ' + results[0].username + ' eat cookie :) in 30m');
													con.query('UPDATE cookies SET last_executed=CURRENT_TIMESTAMP WHERE username="' + user['username'] + '"', function (error, results, fields) {
														if (error) {
															kb.say(channel, user['username'] + ", database error LUL")
														}
													})
												}
											} else if (results[0].rank === 'p3') {
												if (cookieApi.seconds_left<1180) {
													kb.whisper(user['username'] + ' your cookie is still on cooldown (' + cookieApi.time_left_formatted + '), wait 20m intervals. To force your cookie reminder do "kb cookie force" in chat.');
												} else {
													kb.say(channel, '$remind ' + results[0].username + ' eat cookie :) in 20m');
													con.query('UPDATE cookies SET last_executed=CURRENT_TIMESTAMP WHERE username="' + user['username'] + '"', function (error, results, fields) {
														if (error) {
															kb.say(channel, user['username'] + ", database error LUL")
														}
													})
												}
											} else if (results[0].rank === 'p4') {
												if (cookieApi.can_claim === false) {
													kb.whisper(user['username'] + ' your cookie is still on cooldown (' + cookieApi.time_left_formatted + '), wait intervals. To force your cookie reminder do "kb cookie force" in chat.');
												} else {
													kb.say(channel, user['username'] + ', the rank you have set is currently not supported, see "kb help cookie" for command syntax.');
													con.query('UPDATE cookies SET last_executed=CURRENT_TIMESTAMP WHERE username="' + user['username'] + '"', function (error, results, fields) {
														if (error) {
															kb.say(channel, user['username'] + ", database error LUL")
														}
													})
												}
											} else if (results[0].rank === 'p5') {
												if (cookieApi.can_claim === false) {
													kb.whisper(user['username'] + ' your cookie is still on cooldown (' + cookieApi.time_left_formatted + '), wait intervals. To force your cookie reminder do "kb cookie force" in chat.');
												} else {
													kb.say(channel, user['username'] + ', the rank you have set is currently not supported, see "kb help cookie" for command syntax.');
													con.query('UPDATE cookies SET last_executed=CURRENT_TIMESTAMP WHERE username="' + user['username'] + '"', function (error, results, fields) {
														if (error) {
															kb.say(channel, user['username'] + ", database error LUL")
														}
													})
												}
											} else if (results[0].rank === 'default_rank') {
												if (cookieApi.cookieApi<7180) {
													kb.whisper(user['username'] + ' your cookie is still on cooldown (' + cookieApi.time_left_formatted + '), wait 2h intervals. To force your cookie reminder do "kb cookie force" in chat.');
												} else {
													kb.say(channel, '$remind ' + results[0].username + ' eat cookie :) in 2h');
													con.query('UPDATE cookies SET last_executed=CURRENT_TIMESTAMP WHERE username="' + user['username'] + '"', function (error, results, fields) {
														if (error) {
															kb.say(channel, user['username'] + ", database error LUL")
														}
													})
												}
											} else {
												kb.say(channel, user['username'] + ', monkaS switch statement error');
											}
										}
									}
								})
							})
							return query
						}
						respo()
					}
				})
				return '';
			} catch(returnValue) {
				return returnValue;
			}
		}
	},

	{
		name: "kunszgbot",
		aliases: "kunszgbot,",
		invocation: async (channel, user, message, args) => {
			if (talkedRecently2.has(user['user-id'])) { //if set has user id - ignore
				return '';  				    
			} else {   
	     		talkedRecently2.add(user['user-id']);
            	setTimeout(() => {
         			talkedRecently2.delete(user['user-id']);
	            }, 30000);
	        }
	        if (user['user-id'] === '68136884') {
	        	return ''
	        }
	        return 'get 🅱️inged back ' + user['username'] + ' FeelsDankMan';
		}
	},

	{
		name: "AlienPls",
		aliases: null,
		invocation: async (channel, user, message, args) => {   
			const allowedChannels = [
				{ID: '#supinic'},
				{ID: '#nymn'},
				{ID: '#pajlada'}
			];
			const checkChannels = allowedChannels.filter(
				i => i.ID === channel
				);
			const checkChannelsMap = checkChannels.map(
				i => i.ID
				)
		    if (channel === checkChannelsMap[0] && user['user-id'] === "178087241") {
	    		return "AlienPls";
	    	} else {
    			return '';
	    	}
	    }
	},

	{
		name: 'ppBounce',
		aliases: null,
		permission: 'restricted',
		invocation: async (channel, user, message, args) => {
					    
			const allowedChannels = [
				{ID: '#supinic'},
				{ID: '#pajlada'}
			];
			const checkChannels = allowedChannels.filter(
				i => i.ID === channel
			);
			const perms = allowFastramid.filter(
				i => i.ID === user['user-id']
			);
		    if (channel === checkChannels[0].ID && user['user-id'] === "268612479") {
	    		return "ppBounce ❗ ";
	    	} else {
    			return '';
	    	}
		}
	},

    {
		name: dankPrefix + "deval",
		aliases: null,
		invocation: async (channel, user, message, args) => {
			try{	
				if (user['user-id'] != "178087241") {
						return ''.replace(/[\u{E0000}|\u{206d}]/gu, '');
				} else {
					function reverse(s) {
						return s.split('').reverse().join('');
					}

					function hasNumber(myString) {
 						return /\d/.test(myString);
					}

					function sleep(milliseconds) {
					  	const start = new Date().getTime();
					  	for (var i = 0; i < 1e7; i++) {
					    	if ((new Date().getTime() - start) > milliseconds){
					     		break;
					    	}
					  	}
					}
					const msg = message.split(" ");
					const msg2 = msg.shift();
					const ev = await eval('(async () => {' + msg.join(" ").replace(/[\u{E0000}|\u{206d}]/gu, '') + '})()');
					console.log(ev);
					return String(ev);
				}
			} catch(err) {
				console.log(err);
				return user['username'] + ", " + err + " FeelsDankMan !!!";
			}
		}
	},

		{
      	name: "test",
      	aliases: "test \u{E0000}",
      	invocation: (channel, user, args) =>  {
        	if (user['user-id'] === "178087241" || user['user-id'] === "229225576") { //kunszg
            	return user['username'] + ", FeelsGoodMan test successful FeelsGoodMan";
    		}
        	else {
    			return "";
    		}
    	}
    },
];

kb.on("chat", async (channel, user, message, self) => {
	if (user['user-id'] === "249408349") return;
	if (self) return;
	dankeval.forEach(async smart => {
	if ((message.split(' ')[0] === smart.name) ||
	    (smart.aliases && message.split(' ')[0] === smart.aliases)) {
		    let result = await smart.invocation(channel, user, message);
		    if (!result) {
		    	kb.say(channel, '');
		    }
			if (result === "undefined") {
		    	kb.say(channel, user['username'] + ", FeelsDankMan something fucked up")
		    	return;
			} else {
		   		if (result === '') {
		    		kb.say(channel, '')
		    		return;
			    }
	    		else if (repeatedMessages[channel] === result) {
			      	result += " \u{E0000}";
		    	}
		    }
		    repeatedMessages[channel] = result;
		    if (result === "undefined") {
		    	return;
		    } else {
		    	commandsExecuted.push('1');
		   		kb.say(channel, result.toString());
			}
		}
	});
});
	/*	
	
	kb.on('notice', (channel, message, msgid) => {
		console.log(message)
		console.log(msgid)
		if (message != 'color_changed' && message != 'msg_channel_suspended') {
			if (channel != '#supinic') {
				kb.say('kunszg', msgid);
			} else {
				return;
			}
		}
	})

	*/

	kb.on('message', function (channel, user, message) {
		if (channel === '#nymn') {
			if (user['user-id'] === '229225576' || message === '') {
				return;
			} else { 
				con.query('INSERT INTO logs_nymn (username, message, date) VALUES ("' + user['username'] + '", "' + message.replace(/[\u{E0000}|\u{206d}]/gu, '') + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
					if (error) {
						console.log(error);
						con.query('INSERT INTO error_logs (error_message, date) VALUES ("' + error + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
							if (error) {
								console.log(error);
								throw error;
							}
						})
					}
				})
			}
		} else if (channel === '#haxk') {
			if (user['user-id'] === '229225576' || message === '') {
				return;
			} else {
				con.query('INSERT INTO logs_haxk (username, message, date) VALUES ("' + user['username'] + '", "' + message.replace(/[\u{E0000}|\u{206d}]/gu, '') + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
					if (error) {
						console.log(error);
						con.query('INSERT INTO error_logs (error_message, date) VALUES ("' + error + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
							if (error) {
								console.log(error);
								throw error;
							}
						})
					}
				})
			}
		} else if (channel === '#supinic') {
			if (user['user-id'] === '229225576' || message === '') {
				return;
			} else {
				con.query('INSERT INTO logs_supinic (username, message, date) VALUES ("' + user['username'] + '", "' + message.replace(/[\u{E0000}|\u{206d}]/gu, '') + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
					if (error) {
						console.log(error);
						con.query('INSERT INTO error_logs (error_message, date) VALUES ("' + error + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
							if (error) {
								console.log(error);
								throw error;
							}
						})
					}
				})
			}
		} else {
			return;
		}
	})
	
{
	  //active commands
	  kb.on('chat', function (channel, user, message) { 
	  	if (channel === '#haxk' && message === "!xd") {
					kb.say('haxk', "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠛⠛⠛⠛⠛⠛⠿⠿⣿⣿⣿⣿⣿ ⣿⣿⣯⡉⠉⠉⠙⢿⣿⠟⠉⠉⠉⣩⡇⠄⠄⢀⣀⣀⡀⠄⠄⠈⠹⣿⣿⣿ ⣿⣿⣿⣷⣄⠄⠄⠈⠁⠄⠄⣠⣾⣿⡇⠄⠄⢸⣿⣿⣿⣷⡀⠄⠄⠘⣿⣿ ⣿⣿⣿⣿⣿⣶⠄⠄⠄⠠⣾⣿⣿⣿⡇⠄⠄⢸⣿⣿⣿⣿⡇⠄⠄⠄⣿⣿ ⣿⣿⣿⣿⠟⠁⠄⠄⠄⠄⠙⢿⣿⣿⡇⠄⠄⠸⠿⠿⠿⠟⠄⠄⠄⣰⣿⣿ ⣿⡿⠟⠁⠄⢀⣰⣶⣄⠄⠄⠈⠻⣿⡇⠄⠄⠄⠄⠄⠄⠄⢀⣠⣾⣿⣿⣿ ⣿⣷⣶⣶⣶⣿⣿⣿⣿⣷⣶⣶⣶⣿⣷⣶⣶⣶⣶⣶⣶⣿⣿⣿⣿⣿⣿⣿ ");
				}
		else return;
	  });
	  kb.on("resub", function (channel, username, months) {
	  	if (channel != "#supinic") return;
	  	else
	    kb.say("Supinic", username + " has resubscribed, welcome back in hackermans club HACKERMANS")
	  });

	  kb.on("timeout", function (channel, username, message, duration) {
	  	if (channel != "#supinic")  { 
	  		return; 
	  	}
	    else {
	    	if (duration == '1') {
	    		kb.say(channel, username + " vanished Article13 magicWand ")
	    	}
		    else { 
		    	kb.say(channel, username + " has been timed out for " + duration + "s Article13 magicWand ")
		    	}
			}
	  });

	  kb.on("ban", function (channel, username) {
	  	if (channel != "#supinic") return;
	  	else
	    kb.say("Supinic", username + " has been permamently banned pepeMeltdown")
	  });

	  kb.on("hosted", function (channel, username, viewers) {
	  	if (channel != "#supinic") return;
	  	else
	    kb.say("Supinic", username + " hosted supinic with " + viewers + " viewers HACKERMANS ")
	  });

	  kb.on("subgift", (channel, username, streakMonths, recipient, userstate) => {
	  	if (channel != "#supinic") return;
	  	else
	    kb.say("Supinic", username + " has gifted a sub to " + recipient + " and it's their " + streakMonths + " month/s resub! ppBounce ")
	  });

	  kb.on("submysterygift", (channel, username, numbOfSubs, methods, userstate) => {
	  	if (channel != "#supinic") return;
	  	else
	    kb.say("Supinic", username + " is giving away " + numbOfSubs + " and they have already gifted " + userstate + " subs to Supinic peepoPooPoo ")
	    let senderCount = ~~userstate["msg-param-sender-count"];
	  });

	  kb.on("subscription", (channel, username) => {
	  	if (channel != "#supinic") return;
	  	else
	    kb.say("Supinic", username + " has subscribed! Welcome to the HACKERMANS 's club " )
	  });

	  kb.on("raided", (channel, username, viewers) => {
	  	if (channel != "#supinic") return;
	  	else
	    kb.say("Supinic", username + " raided supinic with " + viewers + " viewers PagChomp ")
	  });

	  kb.on("giftpaidupgrade", (channel, username, sender, userstate) => {
	  	if (channel != "#supinic") return;
	  	else
	   kb.say("Supinic", username + " is continuing the gifted sub they got from " + sender + " PagChomp ")
	 });
	}
})

const Discord = require('discord.js');
const disco = new Discord.Client();

disco.on('ready', () => {
  console.log(`Logged in as ${disco.user.tag}!`);
});

disco.on('message', async msg => {
	  if (msg.content === '?uptime') {
	    try{
			const fs = require("fs");
			const stats = fs.statSync("./bot.js");
			const fileSizeInBytes = stats['size'];
			const size = fileSizeInBytes / 1000
		      function format(seconds){
		        function pad(s){
		        	return (s < 10 ? '0' : '') + s;
			}

		        var hours = Math.floor(seconds / (60*60));
		        var minutes = Math.floor(seconds % (60*60) / 60);
		        var seconds = Math.floor(seconds % 60);
		        	return hours + 'h ' + minutes + 'm ' + seconds + "s";  
		    } 
			    const uptime = process.uptime();

			    const os = require('os');
			    const up = os.uptime() / 3600; //system uptime in hours
		        const up2 = os.uptime() / 86400; //system uptime in days

		        const linecount = require('linecount')
		        const lines = await new Promise((resolve, reject) => { //line count
		        	
		        	linecount('./bot.js', (err, count) => {
				       	if (err) {
				            reject(err);
					    }
					    else{
					        resolve(count);
					    }   
				    });
				});

        msg.reply(
	        "Code is running for " + format(uptime) +
	        " and has " + lines + " lines total, size of the bot file is " + size.toFixed(3) + " KB," +
	        " my system runs for: " + up.toFixed(1) + "h (" + up2.toFixed(2) + " days)"); 

			} catch(err) { 		    	
			  	    msg.reply(err);
		        }
		    }
		});
disco.on('message', async msg => {
  if (msg.content.split(' ')[0] === '?joke') {
		try{		
         	function firstLettertoLowerCase(string) {
				return string.charAt(0).toLowerCase() + string.slice(1);
			}
			const arr = [
			'general',
			'general',
			'general',
			'general',
			'general',
			'programming',
			'programming'
			]
			const randomPs = arr[Math.floor(Math.random()*arr.length)];
			console.log(randomPs)
			if (randomPs === 'programming') {
				const joke = await fetch(api.joke1) 
		 			.then(response => response.json()); 
	 			setTimeout(() => { 
	 				msg.channel.send(firstLettertoLowerCase(joke[0].punchline.replace(/\./g, '')) + ' 😂'
	 				)}, 4000);
	 			msg.reply( firstLettertoLowerCase(joke[0].setup));
	 		}
	 		else if (randomPs === 'general') {
	 			const jokeGeneral = await fetch(api.joke2) 
		 			.then(response => response.json()); 
	 			setTimeout(() => { 
	 				msg.channel.send(firstLettertoLowerCase(jokeGeneral.punchline.replace(/\./g, '')) + ' 😂 '
	 				)}, 4000);
	 			msg.reply(firstLettertoLowerCase(jokeGeneral.setup));
	 		}

	 		} catch(err) {
				console.log(err);
				msg.reply(err);
				}
			}
		});
{
const talkedRecently = new Set();
disco.on('message', async msg => {
  if (msg.content.split(' ')[0] === '?ping') {

try {
	const msg1 = msg.content.split(' ');
	const msg2 = msg1.shift();
 	const used = process.memoryUsage().heapUsed / 1024 / 1024;
   
	if (talkedRecently.has(disco.user.tag)) { //if set has user id - ignore
    	return '';  
    } else {   
     talkedRecently.add(disco.user.tag);
     setTimeout(() => {
      // removes the user from the set after 10s
      talkedRecently.delete(disco.user.tag);
            }, 5000);
        }
    if (!msg1[0]) {
	        const ping = await kb.ping();
		    msg.reply(", pong FeelsDankMan 🏓 ppHop 🏓💻, latency: " + ping*1000 + "ms, memory usage: " + 
			    (used).toFixed(2) + " MB (" + ((used / 8000)*100).toFixed(2) + "%)");
		}
    } catch(err) {
			if (err.message.includes("undefined")) {
				msg.channel.send(err + ", N OMEGALUL")
			}
   			msg.channel.send(err + " FeelsDankMan !!!");
    		}
		}
	})
}

disco.login(api.discord);
