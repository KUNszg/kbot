#!/usr/bin/env node
'use strict';

require('./lib/handler.js');
require('./lib/static/interval_calls.js');
require('./lib/static/static_commands.js');

let path = require('path');
require('node-oom-heapdump')({
    path: path.resolve(__dirname, 'my_heapdump')
});