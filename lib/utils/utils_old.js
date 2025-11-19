#!/usr/bin/env node
'use strict';

const regex = require('../../consts/regex.js');

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

const { YTSearcher } = require('ytsearcher');
const creds = require('../credentials/config.js');
const searcher = new YTSearcher(creds.youtube);
exports.youtube = async (query, results) => {
  const result = await searcher.search(query, { type: 'video' });
  return result.first;
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
