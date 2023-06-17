const crypto = require('crypto');

const key = crypto.randomBytes(32);

const iv = crypto.randomBytes(16);

const endecrypt = (text, algorithm = 'aes-256-cbc') => {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex'), algorithm };
};

const decrypt = text => {
  let iv = Buffer.from(text.iv, 'hex');
  let encryptedText = Buffer.from(text.encryptedData, 'hex');
  let algorithm = text.algorithm;

  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};

module.exports = { encrypt: endecrypt, decrypt };
