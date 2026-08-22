const _ = require('lodash');
const regex = require('../../../consts/regex');

const endecrypt = require("./endecrypt");

const prepareMessage = (messageChunk, lastMessage) => {
  messageChunk = _.join(messageChunk, '');

  const messageHash = _.get(endecrypt.encrypt(messageChunk), 'encryptedData');

  if (messageHash === lastMessage) {
    messageChunk += '\u{E0000}';
  }

  return messageChunk;
};

module.exports = prepareMessage;
