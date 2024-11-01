const _ = require('lodash');

const endecrypt = require("./endecrypt");

const prepareMessage = (messageChunk, lastMessage) => {
  messageChunk = _.join(messageChunk, '');

  const messageHash = _.get(endecrypt.encrypt(messageChunk), 'encryptedData');

  if (messageHash === JSON.parse(lastMessage)) {
    messageChunk += '\u{E0000}';
  }

  return messageChunk;
};

module.exports = prepareMessage;
