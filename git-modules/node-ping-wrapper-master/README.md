# node-ping-wrapper

Ping wrapper for node - one process listening on stdout is spawned; inherits from EventEmitter

## Usage:

```js
var Ping = require('ping-wrapper');


// load configuration from file 'config-default-' + process.platform
// Only linux is supported at the moment
Ping.configure();


var ping = new Ping('127.0.0.1');

ping.on('ping', function(data){
	console.log('Ping %s: time: %d ms', data.host, data.time);
});

ping.on('fail', function(data){
	console.log('Fail', data);
});


// later you can call ping.stop()
```