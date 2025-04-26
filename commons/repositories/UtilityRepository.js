const humanize = require('humanize-duration');
const _ = require('lodash');

const regex = require('../../consts/regex');

const customHttpStatus = require('./utils/customHttpStatus');
const CommonRepository = require('./CommonRepository');

let instance = null;

class UtilityRepository extends CommonRepository {
  static shortHumanize = humanize.humanizer({
    language: 'shortEn',
    languages: {
      shortEn: {
        y: () => 'y',
        mo: () => 'mo',
        w: () => 'w',
        d: () => 'd',
        h: () => 'h',
        m: () => 'm',
        s: () => 's'
      }
    }
  });

  constructor(serviceConnector = {}) {
    super(serviceConnector);
  }

  /**
   * Returns the singleton instance of UtilityRepository.
   * If an instance does not exist, it creates one using the provided sqlClient.
   * @param {Object} serviceConnector - Client connection manager.
   * @returns {UtilityRepository} The singleton instance of UtilityRepository.
   */
  static getInstance(serviceConnector) {
    if (!instance) {
      instance = new UtilityRepository(serviceConnector);
    }
    return instance;
  }

  /**
   * @description
   * Replaces all %{key} in `html` with values from `repl[0]`.
   * @param {string} html - The HTML to replace values in.
   * @param {Object[]} repl - An array of objects where the first object's values
   * should be used as replacement values.
   * @returns {string} The modified HTML.
   */
  complementHtmlPageTemplates(html, repl) {
    this.html = html;
    this.value = repl[0];
    this.valueKeys = Object.keys(repl[0]).map(i => `%{${i}}`);

    for (let i = 0; i < this.valueKeys.length; i++) {
      this.html = this.html.replace(
        this.valueKeys[i],
        this.value[this.valueKeys[i].replace(/^%{/, '').replace(/}$/, '')]
      );
    }

    return this.html;
  }

  /**
   * Generates a random string of characters.
   * @param {number} [length=15] - The length of the string to generate.
   * @return {string} A random string of characters.
   */
  stringGenerator(length = 15) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * @description
   * Randomly select an element from the given array.
   * @param {any[]} array - The array to select from.
   * @returns {any} - A randomly selected element from `array`.
   */
  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Convert given number of seconds into human readable duration.
   * @param {number} seconds - The number of seconds to convert.
   * @returns {string} - The human readable duration.
   * @example
   * humanizeDuration(60) // '1m '
   * humanizeDuration(3661) // '1h 1m 1s'
   */
  humanizeDuration(seconds) {
    return UtilityRepository.shortHumanize(seconds * 1000, {
      units: ['y', 'mo', 'd', 'h', 'm', 's'],
      largest: 3,
      round: true,
      spacer: ''
    });
  }

  /**
   * Given a command name, this function returns the URL associated with it.
   * The command name is processed to remove any invisible characters and
   * any text that is enclosed by curly braces.
   * @param {string} command_name - The command name to look up the URL for.
   * @return {string|string[]} The URL associated with the given command name.
   * If the associated URL is a list of URLs, an array of strings is returned.
   */
  // todo: REPLACE utils.Get.api().url() with this
  async getExternalApiUrlByCommandName(command_name) {
    const { detectedCommand } = await this.standarizeUserInput(command_name);

    const apiData = await this.serviceConnector.sqlClient.query(
      `
              SELECT *
              FROM api_data
              WHERE tags LIKE ?`,
      [`%${detectedCommand}%`]
    );

    return _.split(_.get(_.first(apiData), 'url'), ' ') || null;
  }

  /**
   * Given a command name, this function returns the API key associated with it.
   * The command name is processed to remove any invisible characters and
   * any text that is enclosed by curly braces.
   * @param {string} command_name - The command name to look up the API key for.
   * @return {string} The API key associated with the given command name.
   */
  // todo: REPLACE utils.Get.api().key() with this
  async getExternalApiKeyByCommandName(command_name) {
    const { detectedCommand } = await this.standarizeUserInput(command_name);

    const apiData = await this.serviceConnector.sqlClient.query(
      `
              SELECT *
              FROM api_data
              WHERE tags LIKE ?`,
      [`%${detectedCommand}%`]
    );

    return _.get(_.first(apiData), 'key') || null;
  }

  /**
   * @function customHttpStatus
   * @description Returns a custom HTTP status message based on the code provided.
   * @param {number} code - The HTTP status code.
   * @return {string} The custom HTTP status message.
   */
  customHttpStatus(code) {
    return customHttpStatus(code);
  }

  /**
   * Limits multiple string inputs to a specified maximum number of characters
   * and adds "(...)" indicator when truncation occurs
   * @param {number} [maxLength=30] - Maximum allowed length (default: 30)
   * @param {Array} inputs - One or more inputs to limit
   * @returns {Array} Array of limited strings
   */
  limitInputLength(inputs = [], maxLength = 30) {
    return _.map(inputs, input => {
      const str = String(input);

      if (!str) {
        return input;
      }

      if (_.size(str) > maxLength) {
        return `${_.join(_.slice(str, 0, maxLength), '')}(...)`;
      }

      return str;
    });
  }

  getCommandNameFromText(text) {
    const textWithoutPrefix = _.tail(_.split(text, ' '));
    return _.first(textWithoutPrefix);
  }

  async standarizeUserInput(text) {
    if (_.isEmpty(text)) {
      return _.stubString();
    }

    const textWithoutInvisibleCharacters = _.replace(text, regex.invisChar, '');
    const textWithSingleSpace = _.replace(
      textWithoutInvisibleCharacters,
      regex.moreThanOneSpace,
      ' '
    );

    const command = this.getCommandNameFromText(textWithSingleSpace);
    const aliases = (await this.serviceConnector.redisClient.get('kb:global:aliases')) || [];

    const detectedAliasGroup = _.find(aliases, detectedAlias => detectedAlias.key === command);
    const detectedAlias = _.get(detectedAliasGroup, 'key');
    const detectedCommand = _.get(detectedAliasGroup, 'value') || command;

    let aliasAsRegexp = null;
    let convertedText = textWithSingleSpace;

    if (detectedAlias) {
      aliasAsRegexp = new RegExp(`\\b${detectedAlias}\\b`, 'i');
      convertedText = _.replace(textWithSingleSpace, aliasAsRegexp, detectedCommand);
    }

    return {
      convertedText,
      detectedCommand,
      detectedAlias,
      aliasAsRegexp
    };
  }

  // todo: for stats command etc..
  async isBlockingCommandProcessing(command) {
    return await this.serviceConnector.redisClient.get(
      `kb:cooldown:command:${command}:processing`
    );
  }

  findUsernameInUserInputParts(userInputParts, { trimSubCommand = false } = {}) {
    if (trimSubCommand) {
      userInputParts = _.tail(userInputParts);
    }

    const username = _.replace(
      _.find(userInputParts, part => _.startsWith(part, '@')) || '',
      /[@,]/,
      ''
    );

    if (!_.isEmpty(username)) {
      return username;
    }

    return _.first(userInputParts) || null;
  }
}

module.exports = UtilityRepository;
