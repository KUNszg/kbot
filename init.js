#!/usr/bin/env node

const fs = require('fs')

const files = ["temp_api_uptime.txt", "temp_api_restarting.txt", "aliases.json"];

files.map(i => fs.existsSync(`./data/${i}`) ? "" : fs.writeFileSync(`./data/${i}`, "{}"));

require('./lib/handler');
require('./lib/misc/events');
require('./lib/misc/loops');
require('./lib/misc/chatters');
require('./discord/scripts/reddit-livethread-autoposting');