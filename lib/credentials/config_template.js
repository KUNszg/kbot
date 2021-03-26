/* 	Find the API's mentioned below and change this file's name to "config.js" */

exports.oauth = 'oauth:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // Twitch oauth
exports.db_user = 'MYSQL_USER'; // mysql database username, leave blank for no username
exports.db_pass = "MYSQL_PASS"; // mysql database password, leave blank for no pass
exports.db_name = "MYSQL_DB_NAME"; // name of database
exports.db_host = "MYSQL_HOST"; // localhost by default
exports.db_server_user = "root"; // root by default
exports.client_id = 'Twitch client ID';
exports.client_secret = 'Twitch client secret';
exports.client_id_spotify = 'Spotify client ID'; // ./lib/commands/spotify
exports.client_secret_spotify = 'Spotify client secret'; // ./lib/commands/spotify
exports.youtube = 'youtube API key'; // ./lib/commands/rt
exports.randomTrack = 'musixmatch API Key'; // ./lib/commands/rt
exports.locate = 'ipstack API key'; // ./lib/commands/locate
exports.supinic = 'https://supinic.com/api/bot/active?auth_user=USER_ID&auth_key=AUTH_KEY'; // API to ping supinic's bot alive check, required by default, you can remove it from code located in ./lib/misc/loops refering to this endpoint to skip this part
exports.lastfmApiKey = "lastfm api key" // ./lib/commands/spotify
exports.discord = 'discord api key' // not yet implemented

