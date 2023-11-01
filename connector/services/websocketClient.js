const ws = require('ws');
const EventEmitter = require('events');

const WebSocket = require('ws');

class WebsocketEmitter extends EventEmitter {}

const websocketEmitter = new WebsocketEmitter();

const websocketClient = {
  connect: async function () {
    const clientLocal = new WebSocket.Server({ port: 3001, path: '/wsl' });
    const clientPublic = new WebSocket.Server({ port: 3000, path: '/ws' });

    global.websocketClient = { clientLocal, clientPublic, websocketEmitter };
  },
};

module.exports.websocketClient = websocketClient;
