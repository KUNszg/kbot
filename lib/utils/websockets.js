const WebSocket = require("ws");
const fs = require("fs");
const shell = require("child_process");
const got = require("got");
const utils = require("./utils.js");

const EventEmitter = require('events');
class Emitter extends EventEmitter {}
const eventEmitter = new Emitter();

// local websockets
const wssLocal = new WebSocket.Server({ port: 3001, path: "/wsl" });

shell.exec("sudo rm ../../data/temp_websockets_auth*");

wssLocal.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
        const i = Math.trunc(Math.random() * 99999);

        const auth = utils.genString();

        // write a file with 15 random characters string
        fs.writeFileSync(`../../data/temp_websockets_auth${i}.txt`, auth) 

        new utils.WSocket("ws").emit({"body": JSON.parse(message), "authId": i, "auth": auth});
    })
});

// public websockets
const wssPublic = new WebSocket.Server({ port: 3000, path: "/ws" });

let cache = { "cache": true };

wssPublic.on("connection", async function connection(ws, req) {
    ws.send(JSON.stringify(cache));

    eventEmitter.on('sendWS', (msg) => {
        ws.send(msg)
    });

    ws.on("message", function incoming(message) {
        try {
            message = JSON.parse(message);
            
            const auth = fs.readFileSync(`../../data/temp_websockets_auth${message.authId}.txt`).toString();            
            if (message.auth === auth) {
                fs.unlinkSync(`../../data/temp_websockets_auth${message.authId}.txt`);

                cache[message.body.type] = { "data": message.body.data };

                eventEmitter.emit('sendWS', JSON.stringify(message));
            }
        }
        catch (err) {
            console.log(err)
            ws.close();
            return;
        }
    });
});

/* hooks */
// github
// liveNotif
// usersTotal
// mps
// commandExecs
// botUptime
// botRestarting