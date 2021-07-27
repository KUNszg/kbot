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

let _cache = {};

const refresh = async () => {
    const _usersTotal = await utils.query("SELECT COUNT(userId) count FROM user_list");
    const _commandExecs = await utils.query("SELECT COUNT(ID) as count FROM executions"); 

    return {"type": {"usersTotal": _usersTotal[0].count, "commandExecs": _commandExecs[0].count}};
}

(async () => {
    _cache = await refresh();
})();

wssPublic.on("connection", async function connection(ws, req) {
    ws.send(JSON.stringify(cache));

    ws.on("message", async (message) => {
        message = JSON.parse(message);
        
        const auth = fs.readFileSync(`../../data/temp_websockets_auth${message.authId}.txt`).toString();            
        if (message.auth === auth) {
            fs.unlinkSync(`../../data/temp_websockets_auth${message.authId}.txt`);

            cache[message.body.type] = { "data": message.body.data };

            if (message.body.type === "updateCache") {
                _cache = await refresh();
            }

            wssPublic.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    if (message.body.type === "usersTotal" || message.body.type === "commandExecs") {
                        _cache.type[message.body.type] = _cache.type[message.body.type] + message.body.data; 
                        client.send(JSON.stringify(_cache));   
                    }
                    else {
                        client.send(JSON.stringify(message));
                    }
                }
            });
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
// clearCache