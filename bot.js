#!/usr/bin/env node

'use strict';
	const api = require('./config.js')
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
		channels: ['kunszg','pajlada','nymn','crayzbeats','ourlordtalos','ali2465','kunszgbot','leebaxd','supinic','sinris','haywoodjabroni','haxk','rrraz','ourlordtalos','vesp3r'],
	};

	const tmi = require('tmi.js');
	const kb = new tmi.client(options);
	const repeatedMessages = {
		supinic: null
	};

	kb.connect();
	kb.on('connected', (adress, port) => {

	const randomApod = require('random-apod'); //apod command - for random astro pic of the day
	const randomWords = require("random-words"); //yt command - for random words to use in youtube search
	const search = require("youtube-search"); // rt and yt commands - random video using random words api
	const si = require('systeminformation'); //ping command - ram usage
	const os = require('os');//uptime command - system uptime
	const rndSong = require('rnd-song');//rt command - random track using youtube search api
	const rf = require('random-facts');//rf command - random fact
	const count = require('mathjs');
	const fs = require('fs');
	const rUni = require('random-unicodes');
	const SpacexApiWrapper = require("spacex-api-wrapper");
	const fetch = require("node-fetch");
	const tmidocs = "https://github.com/tmijs/docs/tree/gh-pages/_posts/v1.4.2";
	const nam = "🏍 🚑 NaM 🚜 🚓 🚛 🚕 NaM 🚚 🚗 🏎 🚜 🚓 🏍 NaM 🚕 🚜 🚕 🚛 🚕 🚚 🚗 SORRY FOR TRAFFIC NAM 🚕 🚜 🚕 🚓 🚛 🏎 🚑 🚒 NaM 🚓 🏍 🚓 🚜 NaM 🏎 🏎 🚜 NaM 🏎 🚜 🚓 🚜 NaM 🚑 🚑 NaM 🚗 🚗 🚚 NaM 🚗 🏎 🏎 🚚 🚛 NaM 🚓 🚜 🚕 🚜 🚙 🏍 NaM 🚙 🏍 🚌 🚲 NaM 🚌 🚐 🚌 🚒 NaM 🚎 🚒 🚙 🚕 🚕 🚑 🏍 🚓 🚜 🚛 NaM 🚚 🚚 🚗 🚗 🚜 🚓 NaM 🚑 🚒 🚑 🚲 🚒🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷 🐷 🍓 🍑 🍊 🍋 🍍 NaM 🍐 🍏 🐬 🐳 NaM 🍆 🐙 🌷";
	const pajas = "⠄⠄⠄⢀⣀⣤⣤⣤⣤⣤⣤⣀⠄⠄⠄⠄⠄⠄⠄⣀⣀⣤⣀⠄⠄⠄⠄⠄ ⠄⠄⣴⣿⣿⣸⣿⣿⠿⠿⠿⠿⢿⣷⣦⡀⢠⣾⣿⣿⣿⣿⣿⣷⣄⠄⠄⠄ ⠄⢰⣿⣟⣛⣩⣵⣶⣿⣿⣿⣿⣷⣶⣭⣕⢹⣯⣶⣶⣶⣶⣶⣦⣿⣆⠄⠄ ⣴⣾⡟⣿⣿⣿⠿⣛⣭⣭⣶⣶⣭⣭⣝⠻⢃⣩⣭⣴⣶⣶⣶⣬⣍⣉⡂⠄ ⣿⣿⠃⣸⡟⣡⣾⣿⣿⣿⣿⢉⠉⣻⣿⣷⢈⣿⣿⣿⣿⣿⣿⣟⢉⠙⣿⣷ ⣿⣿⣿⣿⣧⠻⣿⣿⣿⣿⣿⣶⣴⡿⢟⣫⡬⣙⡛⠿⠿⠿⠿⠿⠷⠾⠛⣩ ⣸⣿⣿⣿⣿⣿⣶⠬⠭⠭⠭⠥⠶⣚⣿⠟⣱⣟⠿⠿⣿⣷⡶⠾⢛⣛⠉⠁ ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣥⣾⣿⣿⣷⣴⣶⣶⣾⣿⣿⣿⠇⠄ ⣿⣿⣿⣿⡿⠿⠿⠿⠿⣿⣿⣿⣿⠿⠿⠿⠟⣛⣛⣛⣛⣋⣭⣭⣶⣶⡾⠄ ⣿⣿⣿⣯⢸⣿⣿⢟⣛⣒⣒⣒⣒⣛⣛⣛⣋⣭⣭⣭⣭⣴⣶⠶⣶⠖⠄⠄ ⣿⣿⣿⣍⠢⣭⣭⣭⣭⣭⣭⣭⣛⣛⣛⣛⣛⣛⣛⣛⣭⣭⠶⠋⠄⠄⠄⠄ ⠄⣠⣦⣭⣭⣭⣝⣛⣓⣊⡩⠭⠭⠭⠭⠿⢛⣛⣋⣭⣌⡀⠄⠄⠄⠄⠄⠄ ⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠄⠄⠄⠄ ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠄⠄⠄ ";
	
	const allowFastramid = [
		{ID: "178087241"}, //kunszg
		{ID: "229225576"} //kunszgbot
	];
		
	const allowEval = [
		{ID: "178087241"}, //kunszg
		{ID: "229225576"}, //kunszgbot
		{ID: '31400525'}, //supinic
		{ID: '458101504'}, //notkunszg
		{ID: '103973901'} //alazymeme
	];

	const allowCookie = [
		{ID: '178087241', username: 'kunszg'},
		{ID: '130432430', username: 'acoffeer'},
		{ID: '194557429', username: 'meacheese'},
		{ID: '40379362', username: 'sinris'},
		{ID: '52246729', username: 'kunszg'}, 
		{ID: '191299545', username: 'thirteen'},
		{ID: '31604719', username: 'agenttud'}, 
		{ID: '181846301', username: 'baldcari'},
		{ID: '41237206', username: 'asakiwaru '}, 
		{ID: '411604091', username: 'Billy_Bones_U '}, 
		{ID: '117691339', username: 'mm2pl'},
		{ID: '188079764', username: 'EUviewer'},
		{ID: '235611601', username: '21mtd'}
	];
	const prefix = "kb ";
	const talkedRecently = new Set();

	const commands = [

		{
		    name: prefix + "uptime",
		    aliases: prefix + "uptime \u{E0000}",
		    invocation: async (channel, user, message, args) => {
			 	try{
					const fs = require("fs");
					const stats = fs.statSync("./bot.js");
					const fileSizeInBytes = stats['size'];
					const size = fileSizeInBytes / 1000
					const used = process.memoryUsage().heapUsed / 1024 / 1024;
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
				    const uptime = process.uptime();
				    const os = require('os');
				    const up = os.uptime() / 3600; //system uptime in hours
			        const up2 = os.uptime() / 86400; //system uptime in days
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
		        	return user['username'] + ", my dank code is running for " + format(uptime) + ", has " + lines + " lines,  memory usage: " + 
						    (used).toFixed(2) + " MB (" + ((used / 8000)*100).toFixed(2) + "%), host is up for " + up.toFixed(1) + "h (" + up2.toFixed(2) + " days) FeelsDankMan"; 
				} catch(err) { 
			  	    return user['username'] + ", " + err + " FeelsDankMan !!!";
		        }
		    }
		},

		{
		    name: prefix + "ping",
			aliases: prefix + "ping \u{E0000}",
		    invocation: async (channel, user, message, args, err) => {
			    try {
			    	const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2);
					if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
			       	 	return '';   
				    } else {   
				     	talkedRecently.add(user['user-id']);
		            		setTimeout(() => {
		              			talkedRecently.delete(user['user-id']);
			            }, 5000);
			        }
				    if (!msg[0]) {
				    	const commits = await fetch('https://api.github.com/repos/KUNszg/kbot/commits')
					 		.then(response => response.json());
					 	const commitDate = new Date(commits[0].commit.committer.date);
					 	const serverDate = new Date();
					 	const diff = Math.abs(commitDate-serverDate)
				      	const DifftoSeconds = (diff / 1000).toFixed(2);
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
				        const ping = await kb.ping();
					    return user['username'] + ", pong FeelsDankMan 🏓 ppHop 🏓💻, latest commit: (master, " +  commits[0].sha.slice(0, 7)  + ", commit " + commits.length + "), "  + format(DifftoSeconds) + " ago";
					}
					else {
						const ping = require('ping');
 
						const hosts = [msg[0]];
						hosts.forEach(function(host){
						    ping.sys.probe(host, function(isAlive){
						        const mesg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
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
		    aliases: prefix + "spacex \u{E0000}",
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
			        	return "Next rocket launch by SpaceX in " + (toHours/24).toFixed(0) + "days, rocket " + space.rocket.rocket_name + ", mission " + space.mission_name +
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
		    invocation: async (channel, user, message, args) => {
	    		try {
		        	const apod = await randomApod();

	   				if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
		       			return '';  
			    	} else {   
			     		talkedRecently.add(user['user-id']);
            			setTimeout(() => {
	               		 	talkedRecently.delete(user['user-id']);
			            }, 6000);
			        }
				    return user['username'] + ", here is your random 🌌 picture of the day | " +
			            apod.title + ": " + apod.image;
				} catch(err) {
			  	    return user['username'] + ", " + err + " FeelsDankMan !!!";
		        }
	  	    }	
	    },

		{
		    name: prefix + "yt",
		    aliases: null,
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
        		 	console.log(msg)

 					if (talkedRecently.has(user['user-id'])) { //if set has user id - ignore
	        			return '';  
		    		} else {   
		     			talkedRecently.add(user['user-id']);
            			setTimeout(() => {
              				talkedRecently.delete(user['user-id']);
			            }, 7000);
			        }
	        		if (msg.length > 0) {
						return user['username'] + ", results with searched phrase '" + msg.join(" ") + "' => " + random1.results[0].link
	        		}
					else if (msg.length = 1) {
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
			invocation: async (channel, user, message, args) => {				
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
				    else if (msg[0] == "join") { 
				       	 	kb.join(msg[1]);
				        	return "succesfully joined " + msg[1].split("").toString().replace(/,/g,"\u{E0000}") + " :) 👍";
				    }
				    else if (msg[0] == "part") {
				        kb.part(msg[1]);       
				        return "done";
				    }
				    else if (!msg[0] && !msg[1]) {
				        return "I'm active in " + length + " channels => " + joinedChannels + " 4Head";
				    }
				    else {
				        return "I'm active in " + length + " channels => " + joinedChannels + " 4Head";
				    }
				}

			}
		},
			
		{
			name: prefix + "decode",
			aliases: null,
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
					}
					else {
		  				return user['username'] + ", " + msg.join(' ').split(" ").map(i => String.fromCharCode(parseInt(i, 2))).join("");
					}
				} catch(err) {
	  	   			return user['username'] + ", " + err + " FeelsDankMan !!!";
	           	}
		    }
		},

		{
			name: prefix + "encode",
			aliases: null,
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
					if (!msg.join(" ")) {
						return user['username'] + ", please provide text to convert B)"
					}
					else {
		  				return user['username'] + ", " + msg.join(" ").replace(/[\u{E0000}|\u{206d}]/gu, '').split("").map(i => i.charCodeAt(0).toString(2)).join(" ");
					}
				} catch(err) {    	
			  	    return user['username'] + ", " + err + " FeelsDankMan !!!";
		        }
		    }
		},

		{
			name: prefix + "chat",
			aliases: prefix + "ct",
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(" ").splice(2);
					const json = await fetch(api.chat + msg.join("+").normalize("NFD").replace(/[\u0300-\u036f]/g, "")) //chat
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
			invocation: async (channel, user, message, args) => {
				try{
					const msg = message.split(" ").splice(2);
					const ping = await kb.ping();
					const women = {};
					const rU = eval('"' + rUni({ min: 0, max: 1114109 }).replace('u', 'u{') + '}"');	
					const perms = allowEval.filter(
						i => i.ID === user['user-id']
						);

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
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '' + " ").split(" ").splice(2);
					const emote = message.replace(/[\u{E0000}|\u{206d}]/gu, '' + " ").split(" ").splice(5);
					const msgP = message.replace(/[\u{E0000}|\u{206d}]/gu, '' + " ").split(" ").splice(4);
					const emoteP = message.replace(/[\u{E0000}|\u{206d}]/gu, '' + " ").split(" ").splice(5);
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
					const perms = allowEval.filter(
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
						else if (caseChosen[0].case === 'fast' && patternChosen[0].pattern === 'pyramid') {
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
				} catch(err) {
				 	return user['username'] + ", " + err + " FeelsDankMan !!!";
				}	
			}
		},

		{
			name: prefix + "reverse",
			aliases: null,
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
			        const locate = await fetch("http://api.ipstack.com/" + msg.join(' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + api.locate)
						.then(response => response.json());

					if (locate.type != null && hasNumber(msg[0])) {
					 	return user['username'] + ", location for " + msg + " => type: " + locate.type + ", country: " + 
					 		locate.country_name + ", region: " + locate.region_name + ", city: " + locate.city + " monkaS";
					}
					else {
						if (!msg[0]) {
							return user['username'] + ", please provide an IP or location to search :)";
						}
						else if (!hasNumber(msg[0]) && msg[0].match(/[a-z]/i)) {
							const location = await fetch(api.geonames + msg.join(' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '&maxRows=1&username=kunszg')
							 	.then(response => response.json());
						 	return user['username'] + ', results: ' + location.totalResultsCount + " | location: " + 
							 	location.geonames[0].countryName.replace("ń", "n") + ", " + location.geonames[0].adminName1.replace("ń", "n") + ", " + 
							 	location.geonames[0].name.replace("ń", "n") + " | population: " + location.geonames[0].population + ", info: " + 
							 	location.geonames[0].fcodeName; 
						}
						else {
							return user['username'] + ", could not find given location or location does not exist KKona"; 
						}
					}
				} catch(err) {
					console.log(err);
					if (err.message.includes("read property")) {
						return user['username'] + ", location not found. Don't use special characters, use only characters existing in english alphabet";
					} else {
						return user['username'] + ", " + err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '') + " FeelsDankMan !!!";
					}
				}	
			}
		},

		{
			name: prefix + "neo",
			aliases: prefix + "asteroid",
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
					return user['username'] + ", " + tweet.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
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
			name: prefix + "song",
			aliases: prefix + "dubtrack",
			invocation: async (channel, user, message, args) => {
				try{
				  	if(user['user-id'] === '68136884') {
						return '';
					} else {
						const dubtrack = await fetch("https://api.dubtrack.fm/room/supinic")
				 			.then(response => response.json());
			 		
			 			if (talkedRecently.has(user['user-id'])) { 
				        		return '';  
				    		} else {   
				     			talkedRecently.add(user['user-id']);
			            			setTimeout(() => {
			              				talkedRecently.delete(user['user-id']);
			            			}, 5000);
			        		}
			 			if (channel != '#supinic') {
			 				return user['username'] + ', that command is not available in this channel.'
			 			}
			 			else {
					 		if (dubtrack.data.currentSong === null) {
					 			return user['username'] + ', there is no song currently playing :/'
					 		}
					 	else {	
					 		return user['username'] + ', current song in dubtrack: ' + dubtrack.data.currentSong.name + 
					 			" " + "https://www.youtube.com/watch?v=" + dubtrack.data.currentSong.fkid;
				 			}
				 		}
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
					console.log(randomPs)

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
	 				const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').split(' ').splice(2);
	 				const fetchUrl = require("fetch").fetchUrl;
	 				const allChannels = [
	 				'nani',
	 				'forsen',
	 				'forsen',
	 				'forsen',
	 				'pajlada',
	 				'pajlada',
	 				'pajlada'
	 				];
		 			const randomChannel = allChannels[Math.floor(Math.random()*allChannels.length)]
		 			if (user['user-id'] === '178087241') {
		 				if (!msg[0]) {
							const fetchUrl = require("fetch").fetchUrl;
							const rl = await new Promise((Resolve, Reject) => {
								fetchUrl(api.rl + randomChannel +  "/user/" + user['username'] + "/random", function(error, meta, body) { 
								    if (error) {
								    	console.log(error);
									   	Reject(error)
						   			}
								    else {
									   	Resolve(body.toString().replace(/"/g, ''))
								   	}
								})
						  	});
		 					return '#' + randomChannel.replace(/^(.{2})/,"$1\u{E0000}") + ', ' + user['username'] + ': ' + rl.toString()
	 					} else {
							const fetchUrl = require("fetch").fetchUrl;
							const rl = await new Promise((Resolve, Reject) => {
								fetchUrl(api.rl + randomChannel +  "/user/" + msg[0] + "/random", function(error, meta, body) { 
								    if (error) {
								    	console.log(error);
									   	Reject(error)
								   	}
								    else {
									   	Resolve(body.toString())
								   	}
								})
						  	});
						  	return '#' + randomChannel.replace(/^(.{2})/,"$1\u{E0000}") + ', ' + msg[0] + ": " + rl.toString().replace(/"/g, '')
	 					}
		 			} else {
	 					if (!msg[0]) {
		 					if (talkedRecently.has(user['user-id'])) { 
				       		 	return '';    
						    } else {   
						     	talkedRecently.add(user['user-id']);
					            setTimeout(() => {
					              	talkedRecently.delete(user['user-id']);
					            }, 5000);
					        }
							const rl = await new Promise((Resolve, Reject) => {
								fetchUrl(api.rl + randomChannel +  "/user/" + user['username'] + "/random", function(error, meta, body) { 
								    if (error) {
								    	console.log(error);
									   	Reject(error)
								   	}
								    else {
									   	Resolve(body.toString().replace(/"/g, ''))
								   	}
								})
						  	});
		 					return '#' + randomChannel + ', ' + user['username'] + ': ' + rl.toString()
	 					} else {
	 						if (talkedRecently.has(user['user-id'])) { 
					        	return ''; 
					    	} else {
						  		talkedRecently.add(user['user-id']);
					            setTimeout(() => {
					              	talkedRecently.delete(user['user-id']);
					            }, 2000);
					        }
							const rl = await new Promise((Resolve, Reject) => {
								fetchUrl(api.rl + randomChannel +  "/user/" + msg[0] + "/random", function(error, meta, body) { 
								    if (error) {
								    	console.log(error);
									   	Reject(error)
								   	}
								    else {
									   	Resolve(body.toString())
								   	}
								})
						  	});
						  	return '#' + randomChannel + ', ' + msg[0] + ": " + rl.toString().replace(/"/g, '')
						}
					}
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
					  	readdirSync('/opt/kbot/node_modules', { withFileTypes: true })
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
	      	invocation: async (channel, user, args) => {
		    	if (talkedRecently2.has(user['user-id'])) { //if set has user id - ignore
					return '';  				    
				} else {   
		     		talkedRecently2.add(user['user-id']);
	            	setTimeout(() => {
	         			talkedRecently2.delete(user['user-id']);
		            }, 5000);
		        }
	        	return user['username'] + ", kunszgbot is owned by KUNszg and " + " ALazyMeme ".replace(/^(.{2})/,"$1\u{E0000}").split("").reverse().join(""
	        		).replace(/^(.{2})/,"$1\u{E0000}").split("").reverse().join("") + " , Node JS " + process.version + 
	        		", running on a DigitalOcean droplet, use prefix 'kbot', for commands list use 'kbot commands'.";
	      	}
	    },

	    {
	    	name: prefix + "joemama",
	    	aliases: prefix + "mama",
	    	invocation: async (channel, user, message, args) => {
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
	    	}
	    },
		
		{
			name: prefix + "restart",
			aliases: null,
			invocation: async (channel, user, message, args) => {
				const perms = allowEval.filter(
					i => i.ID === user['user-id']
				);

				if (!perms[0]) {
					return "";
				} else {
					/* TODO auto pulling from github (restart & update)

					const commits = await fetch('https://api.github.com/repos/KUNszg/kbot/commits')
				 		.then(response => response.json());
					const process = require('child_process');
					await process.exec('cd /opt/kbot; git pull',function (err,stdout,stderr) {
					    if (err) {
					        console.log("\n"+stderr);
					    } else {
					        console.log(stdout);
					    }
					});
					await kb.say(channel, 'successfuly pulled @master, ' + commits[0].sha.slice(0, 7) + ', commit ' + commits.length)
					
					*/
					//const dateString = new Date().toLocaleString().split('/');
					setTimeout(()=>{process.kill(process.pid)}, 3000);
					return user['username'] + ', restarting Okayga'
					//return '🤓 updating...';
				}
			}
		}, 

		{
			name: prefix + 'github',
			aliases: prefix + 'git',
			invocation: async (channel, user, message, args) => {
				if (talkedRecently2.has(user['user-id'])) {
					return '';  				    
				} else {   
		     		talkedRecently2.add(user['user-id']);
	            	setTimeout(() => {
	         			talkedRecently2.delete(user['user-id']);
		            }, 5000);
		        }
		        const commits = await fetch('https://api.github.com/repos/KUNszg/kbot/commits')
			 		.then(response => response.json());
			 	const commitDate = new Date(commits[0].commit.committer.date);
			 	const serverDate = new Date();
			 	const diff = Math.abs(commitDate-serverDate)
		      	const DifftoSeconds = (diff / 1000).toFixed(2);
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
			}
		},

 		{
 			name: prefix + "commands",
 			aliases: null,
 			invocation: async (channel, user, message, args) => {
 				return '';
 			}
 		},

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
			
			if (result === "") { 
			  	return;
			}

			else {
				if (result === "undefined") {
		    	kb.say(channel, "")
		    		}
		    	else {
		    		if (result === '' || result === ' ') {
		    			return;
		    		}
		    		else if (repeatedMessages[channel] === result) {
				      		result += " \u{E0000}";
				    	}
				    }
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

		const banphraseList = [
			{banphrase: 'nigga'}, 
			{banphrase: 'n1gga'}, 
			{banphrase: 'n166a'}, 
			{banphrase: 'nibba'}, 
			{banphrase: 'n1gger'}, 
			{banphrase: 'n166er'}, 
			{banphrase: 'nlbba'}, 
			{banphrase: 'nibber'}, 
			{banphrase: 'negro'}, 
			{banphrase: 'niga'},
			{banphrase: ':joy:'}
		];
		
		const banphraseFilter = banphraseList.filter(
			i => result.includes(i.banphrase)
			);
		const banphraseMap = banphraseFilter.map(
			i => i.banphrase
			)

	    if (!result) {
	    	kb.say(channel, "");
	    } else { 
		    	if (result.replace(/[\u{E0000}|\u{206d}]/gu, '') === "undefined") {
		    		kb.say(channel, 'Internal error monkaS')
		    		return;
		    	}
		    	else if (result.toLowerCase().includes(banphraseMap[0])) {
		    		kb.say(channel, user['username'] + ', cmonBruh 1')
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
					}
					else {
						kb.say(channel, ' object 🦍')
						return;
					}
				}
					await kb.say(channel, result);				
 			}
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
				i => i.name
				);
	      	const xd = trackObj.map(
	      		i => i.name
	      		);
	      	const xdd = ((xd.sort(
	      		).toString(
	    		).replace(/,/g, " | "
	    		).replace('rp |', ''
	    		).replace('secret |', ''
	    		).replace('pattern |', ''
	    		).replace('eval |', ''
	    		).replace('AlienPls |', ''
	    		).replace('HONEYDETECTED |', ''
	    		).replace('cookie |', ''
	    		).replace('| ppBounce', ''
	    		).replace('restart |', ''
	    		).replace(/kb/g, '') + " |").split('|')).length;
	    		
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
	        	xd.sort(
	        		).toString(
		    		).replace(/,/g, " | "
		    		).replace('rp |', ''
		    		).replace('secret |', ''
		    		).replace('pattern |', ''
		    		).replace('eval |', ''
		    		).replace('AlienPls |', ''
		    		).replace('HONEYDETECTED |', ''
		    		).replace('cookie |', ''
		    		).replace('| ppBounce', ''
		    		).replace('restart |', ''
		    		).replace(/kb/g, '') + " |".split(' | ')
	     	
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
      	if (result.includes('00exit')) {
      		kb.say(channel, '')
      	}
      	else {
      		kb.say(channel, result);
      	  	}               
        }
    })
})
const pingAmount = [];
async function sendOnlineStatus() {	
	pingAmount.push('ping')
	const test = (await fetch(api.supinic, { //supinic
	    method: 'PUT',
		}).then(response => response.json()))
	console.log(test)
}	
setInterval(() => {sendOnlineStatus()}, 600000);

const songSet = new Set();
const isDubtrackOn = async () => {
//check for state (vlc, dubtrack, off)
const stateApi = await fetch('https://supinic.com/api/bot/song-request/state') 
	.then(response => response.json());
	//if state is not 'vlc' or 'off'  start polling Dubtrack API
if (stateApi.data.state.toLowerCase() === 'vlc' || stateApi.data.state.toLowerCase() === 'off') {
} else {
	//get data about current song playing in Dubtrack
 	const song = async () => {
		function getData() {
			fetch(`https://api.dubtrack.fm/room/supinic`)
		  		.then(function(response) {
			    	return response.json();
			 	})
		 		.then(function(json) {

		 	 		if (json.data.currentSong === null) {	
					} else {

						if (songSet.has(json.data.currentSong.songid)) { 
							return;  
				  		} else {  
				  	  		songSet.add(json.data.currentSong.songid);
	   		    			setTimeout(() => {
		             		// removes the song ID from the set after 10m
	     	    				songSet.delete(json.data.currentSong.songid);
	            			}, 600000);

		   		    		if (songSet.size > 1) {
		   		    			//get ID of the user that requested the song
	   		    				const getRoom = async () => {
								const room = await fetch(spi.dubtrackRoom)
									.then(response => response.json());
									//get name of the user with user ID
									async function getUser() {
										const getUser2 = await fetch("https://api.dubtrack.fm/user/" + room.data.song.userid)
											.then(res => res.json());

	    								kb.say('supinic', 'New song in dubtrack: ' + json.data.currentSong.name + 
	    									", https://www.youtube.com/watch?v=" + json.data.currentSong.fkid + " requested by " + getUser2.data.username);
	   		    					}
									getUser()
								}
							  	getRoom()
		   		    		}
		     			}
		     		}
		 		});
		 	}
			getData();
		}
		setInterval(() => { song()}, 5000);
	}
}
isDubtrackOn();

//#todo > poznan api
/*
const pozSet = new Set();
const zarzadzenie = async() => {
	const stateApi = await fetch('http://bip.poznan.pl/api-json/bip/zarzadzenia-prezydenta/') 
		.then(response => response.json());
	if (pozSet.has(stateApi['bip.poznan.pl'].data[0].zarzadzenia.items[0].zarzadzenie[0].id)) { 
		return;  
	} else {  
		pozSet.add(stateApi['bip.poznan.pl'].data[0].zarzadzenia.items[0].zarzadzenie[0].id);
		setTimeout(() => {
			pozSet.delete(stateApi['bip.poznan.pl'].data[0].zarzadzenia.items[0].zarzadzenie[0].id);
		}, 3000000000);
		kb.say('kunszg', '@kunszg Nowe rozporządzenie prezydenta Poznania KKurwa  👉 [' + 
			stateApi['bip.poznan.pl'].data[0].zarzadzenia.items[0].zarzadzenie[0].id_klucz + ', ' + 
			stateApi['bip.poznan.pl'].data[0].zarzadzenia.items[0].zarzadzenie[0].status + '] ' +  
			stateApi['bip.poznan.pl'].data[0].zarzadzenia.items[0].zarzadzenie[0].tytul.replace(/&quot;/g, '"') + ' KKurwa Clap ');
	}
}

setInterval(() => {zarzadzenie()}, 900000);
*/

const arr = [ 
  	' FeelsBadChamp ',
  	' 🔊 Bruh ',
  	' 🔊 Bruh ',
  	' 🔊 Bruh ',
  	' 🔊 Bruh ',
  	' 🔊 Bruh ',
  	' Weirdga  ',
  	' peepoSad ',
  	' ManFeels ',
  	' WeirdChamp ',
  	' peepoMad ',
  	' PepeDead ',
  	' PepeDead ',
  	' PepeDead ',
  	' WeirderChamp ',
  	' WeirdMe ',
  	' gachiFeels ',
  	' FeelsWeirdMan ',
  	' pepeL ',
  	' WeirdYou ',
  	' WeebsOut ',
  	' PepeHands ',
  	' ppBeer ',
  	' ppPoof ',
  	' FeelsSuperWeirdMan ',
  	' SansDefault ',
  	' SansDab '
];
/*
setInterval(() => { 
	const randomEmote = arr[Math.floor(Math.random()*arr.length)]; kb.action('haxk', randomEmote + '  🚨 ALERT')
}, 1800000);
*/

const dankPrefix = '?';
const talkedRecently2 = new Set();
const dankeval = [
	{
     	name: dankPrefix + "bot",
      	aliases: dankPrefix + 'help',
      	invocation: (channel, user, args) => {
	    	if (talkedRecently2.has(user['user-id'])) { //if set has user id - ignore
				return '';  				    
			} else {   
	     		talkedRecently2.add(user['user-id']);
            	setTimeout(() => {
 					talkedRecently2.delete(user['user-id']);
	            }, 5000);
	        }
        	return user['username'] + ", kunszgbot is owned by KUNszg and " + " ALazyMeme ".replace(/^(.{2})/,"$1\u{E0000}").split("").reverse().join(""
        		).replace(/^(.{2})/,"$1\u{E0000}").split("").reverse().join("") +  " , Node JS " + process.version + 
        		", running on DigitalOcean server, use prefix 'kbot', for commands list use 'kbot commands'.";
      	}
    },

    {
		name: dankPrefix + 'cookie',
		aliases: null,
		invocation: async (channel, user, args) => {
			const perms = allowCookie.filter(
				i => i.ID === user['user-id']
			);
			console.log(perms)
			if (!perms[0]) {
				return "";
			} else {
				if (talkedRecently.has(user['user-id'])) { 
	        		return user['username'] + ', command is on cooldown PRChase';  
		    	} else {   
			     	talkedRecently.add(user['user-id']);
		            setTimeout(() => {
		              	talkedRecently.delete(user['user-id']);
		            }, 15000);
		        }
				return '$remind ' + user['username'] + ' eat cookie :) in 121m';
			}
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
			
			if (user['user-id'] != "178087241")
					return ''.replace(/[\u{E0000}|\u{206d}]/gu, '');
			
				else {
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
	if (self) return;

	dankeval.forEach(async smart => {
	if 
	   (
	    (message.split(' ')[0] === smart.name) ||
	    (smart.aliases && message.split(' ')[0] === smart.aliases)
	  ) {
		    let result = await smart.invocation(channel, user, message);

			if (result === "undefined") {
		    	kb.say(channel, user['username'] + ", FeelsDankMan something fucked up")
			} else {
				if (result.replace(/[\u{E0000}|\u{206d}]/gu, '') === "undefined") {
		    		kb.say(channel, user['username'] + ", FeelsDankMan something fucked up")
	    		} 
			    else if (result === '') {
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
		    }
		    else {
		   		kb.say(channel, result);
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

	  kb.on("subgift", (channel, username, recipient, months) => {
	  	if (channel != "#supinic") return;
	  	else
	    kb.say("Supinic", username + " has gifted a sub to " + recipient + " and it's their " + months + " month/s resub! ppBounce ")
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
			const stats = fs.statSync("./haxk.js");
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
		        	
		        	linecount('./haxk.js', (err, count) => {
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
	else {
			var Ping = require('./git-modules/node-ping-wrapper-master');
			
			Ping.configure();

			var ping = new Ping(msg1.join(" "));
			
			ping.on('ping', function(data){
				msg.reply((data.match[0].replace("R", "r").replace(":", "")));
				ping.stop()
			});
			ping.on('fail', function(data){
				msg.reply(", ping failed: " + data.match);
				ping.stop();
			});
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
