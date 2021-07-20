#!/usr/bin/env node

const fs = require('fs')  
const files = ["temp_api_uptime.txt", "temp_api_restarting.txt", "aliases.json"];
files.map(i => fs.existsSync(`./data/${i}`) ? "" : fs.writeFileSync(`./data/${i}`, "{}"));

require('./lib/handler.js');
require('./lib/misc/events.js');
require('./lib/misc/loops.js');
require('./lib/misc/chatters.js');