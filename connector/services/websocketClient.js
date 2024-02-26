const EventEmitter = require('events');

const WebSocket = require('ws');
const _ = require('lodash');
const sleep = require('../utils/sleep');

class WebsocketEmitter extends EventEmitter {}

const websocketClient = {
  websocketEmitter: new WebsocketEmitter(),

  connect: () => {},

  //
  // connect: async function () {
  //   this.clients = {
  //     ws: {
  //       isOpen: false,
  //     },
  //     wsl: {
  //       isOpen: false,
  //     },
  //   };
  //
  //   const clientLocal = new WebSocket.Server({ port: 3001, path: '/wsl' }).on(
  //     'connection',
  //     ws => {
  //       this.ws.wsl = ws;
  //
  //       ws.on('open', () => {
  //         this.ws.wsl.isOpen = true;
  //       });
  //
  //       ws.on('message', msg => {
  //         this.websocketEmitter.emit('/wsl', msg);
  //       });
  //
  //       ws.on('error', msg => {
  //         console.log(msg);
  //       });
  //     }
  //   );
  //
  //   const clientPublic = new WebSocket.Server({ port: 3000, path: '/ws' }).on(
  //     'connection',
  //     ws => {
  //       this.ws.ws = ws;
  //
  //       ws.on('open', () => {
  //         this.ws.ws.isOpen = true;
  //       });
  //
  //       ws.on('message', msg => {
  //         this.websocketEmitter.emit('/wsl', msg);
  //       });
  //
  //       ws.on('error', msg => {
  //         console.log(msg);
  //       });
  //     }
  //   );
  //
  //   global.websocketClient = {
  //     ...websocketClient,
  //     clientLocal,
  //     clientPublic,
  //   };
  // },
  //
  // async send(message, options = null) {
  //   const isJson = _.get(options, 'json');
  //   let path = _.get(options, 'path');
  //
  //   if (!!path) {
  //     path = _.startsWith(path, '/') ? path : '/' + path;
  //   } else {
  //     path = '/wsl';
  //   }
  //
  //   const port = path === '/wsl' ? 3001 : 3000;
  //
  //   if (!this.emittersLaunched) {
  //     this;
  //
  //     this.emittersLaunched = true;
  //   }
  //
  //   do {
  //     await sleep(1000);
  //   } while (!this.wsOpen);
  //
  //   this.ws.send(isJson ? JSON.stringify(message) : message);
  // },
};

module.exports.websocketClient = websocketClient;
