
// usage: node ./example.js [IP] [timeout in seconds]

var Ping = require('./ping');


// load configuration from file 'config-default-' + process.platform
// Only linux is supported at the moment
Ping.configure();


var ping = new Ping(process.argv[2] || '127.0.0.1');

ping.on('ping', function(data){
	console.log('Ping %s: time: %d ms', data.host, data.time);
});

ping.on('fail', function(data){
	console.log('Fail', data);
});


if (process.argv[3]) {
	setTimeout(function() {
		ping.stop();
	}, process.argv[3] * 1000);
}