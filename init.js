#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');

(async () => {
  const files = ['temp_api_uptime.txt', 'temp_api_restarting.txt', 'aliases.json'];

  files.map(i => (fs.existsSync(`./data/${i}`) ? '' : fs.writeFileSync(`./data/${i}`, '{}')));

  exec('pm2 start ecosystem.config.js');
})();
