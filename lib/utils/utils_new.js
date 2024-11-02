#!/usr/bin/env node
'use strict';

const mysql = require('mysql2');
const con = require('./connection.js');
const regex = require('../../consts/regex.js');
const utils = require('./utils.js');
const got = require('got');

// check for user permissions with database
exports.checkPermissions = async username => {
  const checkPermissionList = await db.query(
    `
        SELECT *
        FROM trusted_users
        WHERE username=?`,
    [username]
  );

  if (checkPermissionList.length === 0 || checkPermissionList[0].status === 'inactive') {
    return 0;
  }
  return checkPermissionList[0].permissions.split(':')[0];
};

// insert error to database if one occurs
exports.errorLog = async err => {
  await db.query(
    `
        INSERT INTO error_logs (error_message, date)
        VALUES (?, ?)`,
    [err?.message ?? true ? JSON.stringify(err) : err.message, new Date()]
  );
};

exports.format = seconds => {
  var hours = Math.floor(seconds / (60 * 60));
  var minutes = Math.floor((seconds % (60 * 60)) / 60);
  var seconds = Math.floor(seconds % 60);
  if (hours === 0 && minutes != 0) {
    return minutes + 'm ' + seconds + 's';
  } else {
    if (minutes === 0 && hours === 0) {
      return seconds + 's';
    } else {
      return hours + 'h ' + minutes + 'm ' + seconds + 's';
    }
  }
};

exports.capitalizeFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// check if string contains number
exports.hasNumber = str => {
  return /\d/.test(str);
};

// get unicode code of given character
exports.escapeUnicode = str => {
  return str.replace(/[^\0-~]/g, function (ch) {
    return '\\u{' + ('000' + ch.charCodeAt().toString(16)).slice(-4) + '}';
  });
};

exports.lCase = string => {
  return string.charAt(0).toLowerCase() + string.slice(1);
};

// replace invisible character in message and get parameters from the message
exports.getParam = (message, splice) => {
  if (splice) {
    return message.replace(regex.invisChar, '').split(' ').splice(splice).filter(Boolean);
  }
  return message.replace(regex.invisChar, '').split(' ').splice(2).filter(Boolean);
};

exports.strictChannels = (channel, cooldown) => {
  if (cooldown) {
    const channels = ['#forsen', '#vadikus007', '#zoil', '#cyr', '#weest', '#nymn', '#kattah'];
    const currentChannel = channels.filter(i => i === channel);
    if (!currentChannel.length) {
      return false;
    }
    return true;
  }

  const channels = ['#nymn', '#forsen', '#vadikus007', '#pajlada', '#zoil'];
  const currentChannel = channels.filter(i => i === channel);
  if (!currentChannel.length) {
    return false;
  }
  return true;
};

// ignore so channel doesnt get checked for banphrase etc but still gets marked as strict
exports.ignore = channel => {
  const channels = ['#zoil'];
  const currentChannel = channels.filter(i => i === channel);
  if (!currentChannel.length) {
    return true;
  }
  return false;
};

const { YTSearcher } = require('ytsearcher');
const creds = require('../credentials/config.js');
const searcher = new YTSearcher(creds.youtube);
exports.youtube = async (query, results) => {
  const result = await searcher.search(query, { type: 'video' });
  return result.first;
};

const talkedRecently = new Set();

exports.Cooldown = class Cooldown {
  constructor(user, commands, message, permissions, platform) {
    this.userId = user['user-id'];
    this.command = commands[message[1].toLowerCase()].name.replace('kb ', '');
    this.permissions = permissions;
    this.key = `${this.userId}_${this.command}`;
    this.platform = platform;
  }

  // reduce cooldowns for users with permissions
  async cooldownReduction() {
    let cooldown = await db.query(
      `
            SELECT cooldown
            FROM commands
            WHERE command=?`,
      [this.command]
    );

    if (!cooldown.length) {
      return 5000;
    }

    if (typeof cooldown[0].cooldown === 'undefined') {
      return 5000;
    }

    cooldown = cooldown[0].cooldown;

    const sub = val => {
      return cooldown - cooldown * val;
    };

    if (this.platform === 'discord') {
      return cooldown;
    }

    switch (this.permissions) {
      case 1:
        return sub(0.3); // reduce cooldown by 30% for permission 1

      case 2:
        return sub(0.5);

      case 3:
        return sub(0.65);

      case 4:
        return sub(0.75);

      case 5:
        return sub(0.9);

      default:
        return cooldown;
    }
  }

  // command cooldown
  async setCooldown() {
    const owner = await utils.Get.user().owner();
    if (this.userId === owner[0].userId && this.platform != 'discord') {
      return [];
    }

    if (talkedRecently.has(this.key)) {
      return [this.key];
    }

    talkedRecently.add(this.key);

    setTimeout(() => {
      talkedRecently.delete(this.key);
    }, await this.cooldownReduction());
    return [];
  }

  // cooldown between command uses
  async setGlobalCooldown() {
    const owner = await utils.Get.user().owner();
    if (this.userId === owner[0].userId && this.platform != 'discord') {
      return [];
    }

    if (talkedRecently.has(this.userId)) {
      return [this.key];
    }

    talkedRecently.add(this.userId);

    setTimeout(() => {
      talkedRecently.delete(this.userId);
    }, 3000);
    return [];
  }
};

exports.Log = {
  exec(user, input, result, channel) {
    this._result =
      typeof result === 'undefined' || !result ? '' : result.replace(regex.invisChar, '');
    db.query(
      `
            INSERT INTO executions (username, command, result, channel, date)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [user['username'], input.join(' '), this._result, channel.replace('#', '')]
    );
  },
};

const WebSocket = require('ws');

exports.WSocket = class WSocket {
  constructor(path, json = false) {
    this.json = json;
    this.path = path.startsWith('/') ? path : '/' + path;
  }

  emit(message) {
    const port = this.path === '/wsl' ? 3001 : 3000;

    const ws = new WebSocket(`ws://localhost:${port}${this.path}`);

    ws.on('open', function open() {
      if (this.json) {
        ws.send(message);
      } else {
        ws.send(JSON.stringify(message));
      }
      ws.close();
    });
  }
};

exports.ModifyOutput = class ModifyOutput {
  constructor(input, trim = 30) {
    this.input = input;
    this.trim = trim;
  }

  trimmer() {
    const noPing = str => {
      if (str.toLowerCase() === 'constera' || str.toLowerCase() === 'nymn') {
        return str.replace(/^(.{2})/, '$1\u{E0000}');
      }
      return str;
    };

    if (!Array.isArray(this.input)) {
      return this.input.length > this.trim
        ? `${noPing(this.input.substr(0, this.trim))}(...)`
        : noPing(this.input);
    }

    let result = [];

    for (let i = 0; i < this.input.length; i++) {
      result.push(
        this.input[i].length > this.trim
          ? `${noPing(this.input[i].substr(0, this.trim))}(...)`
          : noPing(this.input[i])
      );
    }
    return result;
  }
};
