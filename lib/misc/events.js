#!/usr/bin/env node
'use strict';

const kb = require('../commandManager.js').kb;
const utils = require('../utils/utils.js');
const got = require('got');

const talkedRecently = new Set();

kb.on('chat', async (channel, user, message) => {
  if (message.startsWith('`')) {
    if ((await utils.checkPermissions(user['username'])) < 4) {
      return '';
    }

    if ((await utils.checkPermissions(user['username'])) < 5) {
      if (talkedRecently.has(user['user-id'])) {
        return '';
      } else {
        talkedRecently.add(user['user-id']);
        setTimeout(() => {
          talkedRecently.delete(user['user-id']);
        }, 4000);
      }
    }

    const msgChannel = message
      .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
      .replace('`', '')
      .split(' ')[0];

    const msg = message
      .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
      .split(' ')
      .splice(1)
      .join(' ');

    if (!msg) {
      kb.say(channel, `${user['username']}, no message provided.`);
    }
    kb.say(msgChannel, msg);
  }
  return;
});

kb.on('chat', async (channel, user, message, self) => {
  if (self) {
    return;
  }
  if (channel === '#phayp' && message.split(' ')[0] === 'test') {
    kb.say('phayp', 'peepoHappy <3 test successful');
    return;
  }

  if (channel === '#supinic' && message.split(' ')[0] === '!s') {
    const activeChatters = await got(
      `https://tmi.twitch.tv/group/user/supinic/chatters`
    ).json();
    if (!activeChatters.chatters.broadcaster.length) {
      kb.say(channel, 'ppL');
    } else {
      kb.say(channel, 'monkaS 👉 HACKERMANS ');
    }
    return;
  }

  if (channel === '#haxk' && message.split(' ')[0] === '!h') {
    const activeChatters = await got(`https://tmi.twitch.tv/group/user/haxk/chatters`).json();
    if (!activeChatters.chatters.broadcaster.length) {
      kb.say(channel, 'ppL');
    } else {
      kb.say(channel, 'monkaS');
    }
    return;
  }

  if (channel === '#haxk' && message === '!xd') {
    kb.say(
      'haxk',
      '⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠛⠛⠛⠛⠛⠛⠿⠿⣿⣿⣿⣿⣿' +
        ' ⣿⣿⣯⡉⠉⠉⠙⢿⣿⠟⠉⠉⠉⣩⡇⠄⠄⢀⣀⣀⡀⠄⠄⠈⠹⣿⣿⣿' +
        ' ⣿⣿⣿⣷⣄⠄⠄⠈⠁⠄⠄⣠⣾⣿⡇⠄⠄⢸⣿⣿⣿⣷⡀⠄⠄⠘⣿⣿' +
        ' ⣿⣿⣿⣿⣿⣶⠄⠄⠄⠠⣾⣿⣿⣿⡇⠄⠄⢸⣿⣿⣿⣿⡇⠄⠄⠄⣿⣿' +
        ' ⣿⣿⣿⣿⠟⠁⠄⠄⠄⠄⠙⢿⣿⣿⡇⠄⠄⠸⠿⠿⠿⠟⠄⠄⠄⣰⣿⣿' +
        ' ⣿⡿⠟⠁⠄⢀⣰⣶⣄⠄⠄⠈⠻⣿⡇⠄⠄⠄⠄⠄⠄⠄⢀⣠⣾⣿⣿⣿' +
        ' ⣿⣷⣶⣶⣶⣿⣿⣿⣿⣷⣶⣶⣶⣿⣷⣶⣶⣶⣶⣶⣶⣿⣿⣿⣿⣿⣿⣿ '
    );
  } else if (
    channel === '#supinic' &&
    (message === '$ps sneeze' || message === '$playsound sneeze')
  ) {
    if (talkedRecently.has(user['user-id'])) {
      return;
    } else {
      talkedRecently.add(user['user-id']);
      setTimeout(() => {
        talkedRecently.delete(user['user-id']);
      }, 5000);
    }
    const sleep = milliseconds => {
      const start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
        if (new Date().getTime() - start > milliseconds) {
          break;
        }
      }
    };
    sleep(1000);
    kb.say('supinic', ' bless u peepoSpookDank');
    return;
  } else {
    return;
  }
});
