/* 	Find the API's mentioned below and change this file's name to "config.js" */

const oauth = 'oauth:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // ./lib/credentials/login
const youtube = 'youtube API key'; // ./lib/commands/rt
const randomTrack = 'musixmatch API Key'; // ./lib/commands/rt
const locate = 'ipstack API key' // ./lib/commands/locate
const supinic = 'https://supinic.com/api/bot/active?auth_user=USER_ID&auth_key=AUTH_KEY'; // API to ping supinic's bot alive check, required by default, you can remove it from code located in ./lib/static/interval_calls refering to this endpoint to skip this part
const db_user = 'MYSQL_USER'; // mysql database username, leave blank for no username
const db_pass = "MYSQL_PASS"; // mysql database password, leave blank for no pass
const db_name = "MYSQL_DB_NAME"; // name of database
const db_host = "MYSQL_HOST"; // put localhost if default
const db_server_user = "root"; // server username, root be default
const client_id = 'Twitch client ID';
const client_secret = 'Twitch client secret';
const client_id_spotify = 'Spotify client ID'; // ./lib/commands/spotify
const client_secret_spotify = 'Spotify client secret'; // ./lib/commands/spotify

module.exports = {
    oauth, youtube, randomTrack, locate, supinic, db_user, db_pass, db_name, db_host,
    db_server_user, client_id, client_secret, client_id_spotify, client_secret_spotify
}