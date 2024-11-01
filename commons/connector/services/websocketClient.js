const EventEmitter = require('events');
const WebSocket = require('ws');
const _ = require('lodash');
const sleep = require('../utils/sleep');

class WebsocketEmitter extends EventEmitter {}

/**
 * Singleton class for managing WebSocket connections and related operations.
 */
class WebsocketClient {
  constructor() {
    if (!WebsocketClient.instance) {
      WebsocketClient.instance = this;
      this.websocketEmitter = new WebsocketEmitter();
      this.clients = {
        ws: {
          isOpen: false,
        },
        wsl: {
          isOpen: false,
        },
      };
      this.emittersLaunched = false;
      this.isConnected = false;
    }

    return WebsocketClient.instance;
  }

  /**
   * Establishes WebSocket server connections.
   * This sets up WebSocket servers on specified ports and paths, handling events like connection, message, and error.
   * @returns {void}
   */
  connect() {
    const clientLocal = new WebSocket.Server({ port: 3001, path: '/wsl' }).on(
      'connection',
      ws => {
        this.clients.wsl = ws;

        ws.on('open', () => {
          this.clients.wsl.isOpen = true;
        });

        ws.on('message', msg => {
          this.websocketEmitter.emit('/wsl', msg);
        });

        ws.on('error', msg => {
          console.log(msg);
        });
      }
    );

    const clientPublic = new WebSocket.Server({ port: 3000, path: '/ws' }).on(
      'connection',
      ws => {
        this.clients.ws = ws;

        ws.on('open', () => {
          this.clients.ws.isOpen = true;
        });

        ws.on('message', msg => {
          this.websocketEmitter.emit('/ws', msg);
        });

        ws.on('error', msg => {
          console.log(msg);
        });
      }
    );

    global.websocketClient = {
      ...WebsocketClient.instance,
      clientLocal,
      clientPublic,
    };

    console.log('Websockets connected');

    this.isConnected = true;
  }

  /**
   * Sends a message over a WebSocket connection.
   * If the connection is not yet open, it waits until it is open before sending the message.
   * @param {string|Object} message - The message to send. If `options.json` is true, the message will be JSON stringified.
   * @param {Object} [options={}] - Optional parameters for sending the message.
   * @param {boolean} [options.json=false] - Whether to JSON stringify the message.
   * @param {string} [options.path='/wsl'] - The WebSocket path to use ('/ws' or '/wsl').
   * @returns {Promise<void>}
   */
  async send(message, options = {}) {
    const isJson = _.get(options, 'json', false);
    let path = _.get(options, 'path', '/wsl');

    path = _.startsWith(path, '/') ? path : '/' + path;

    const port = path === '/wsl' ? 3001 : 3000;
    const wsClient = this.clients[path === '/wsl' ? 'wsl' : 'ws'];

    if (!this.emittersLaunched) {
      // Set up any additional emitters or operations that need to occur after WebSocket is ready
      this.emittersLaunched = true;
    }

    do {
      await sleep(1000);
    } while (!wsClient.isOpen);

    wsClient.send(isJson ? JSON.stringify(message) : message);
  }
}

module.exports = {
  websocketClient: new WebsocketClient(),
};
