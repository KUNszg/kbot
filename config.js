const oauth = '' // Bot's oauth, get from here: https://twitchapps.com/tmi - prefixed with oauth:
const youtube = '' // YouTube auth key
const randomTrack = ''
const randomFact = 'https://uselessfacts.jsph.pl/random.json?language=en' // No reason to change this
const chat = 'https://some-random-api.ml/chatbot?message=' // No reason to change this
const locate = ''
const geonames = 'http://api.geonames.org/searchJSON?q=+' // No reason to change this
const nasa1 = 'https://api.nasa.gov/neo/rest/v1/feed?start_date=' // No reason to change this
const nasa2 = '&api_key=<apikey>' // Get an api key here: https://api.nasa.gov/
const twitter = 'https://decapi.me/twitter/latest/' // No reason to change this
const hosts = 'https://decapi.me/twitch/hosts/' // No reason to change this
const bttv = 'https://decapi.me/bttv/emotes/' // No reason to change this
const joke1 = 'https://official-joke-api.appspot.com/jokes/programming/random' // No reason to change this
const joke2 = 'https://official-joke-api.appspot.com/random_joke' // No reason to change this
const rl = 'https://api.gempir.com/channel/' // Requires the channel to have gempir logs enabled
const joemama = 'https://api.yomomma.info/' // No reason to change this
const supinic = 'https://supinic.com/api/bot/active?auth_user=<userid>&auth_key=<authkey>' // `auth_user` is your userid, get it by using `$id` in supinic's chat. `auth_key` can be aquired by pasting this into twitch chat: `/w supibot $authkey generate`.
const dubtrackRoom = 'https://api.dubtrack.fm/room/<roomid>/playlist/active' // Change the room ID
const discord = '' // Discord bot token

module.exports = {oauth, youtube, randomTrack, randomFact, chat, locate, geonames, nasa1, nasa2, twitter, hosts, bttv, joke1, joke2, rl, joemama, supinic, dubtrackRoom, discord}
