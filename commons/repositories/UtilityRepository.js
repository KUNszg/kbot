const humanize = require('humanize-duration');

const regex = require('../../consts/regex');

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
        s: () => 's',
      },
    },
  });

  constructor(sqlClient = {}) {
    super(sqlClient);
  }

  static getInstance(sqlClient) {
    if (!instance) {
      instance = new UtilityRepository(sqlClient);
    }
    return instance;
  }

  htmlPageCompiler(html, repl) {
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

  stringGenerator(length = 15) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  humanizeDuration(seconds) {
    const options = {
      units: ['y', 'mo', 'd', 'h', 'm', 's'],
      largest: 3,
      round: true,
      spacer: '',
    };
    return UtilityRepository.shortHumanize(seconds * 1000, options);
  }

  async url(command_name) {
    const Alias = new utils.Alias(command_name);
    const input = command_name
      .replace(Alias.getRegex(), Alias.getReplacement())
      .replace(regex.invisChar, '');

    this.data = await db.query(
      `
                SELECT *
                FROM api_data
                WHERE tags LIKE ?`,
      [`%${input.split(' ')[1]}%`]
    );

    if (this.data[0].url.split(' ').length > 1) {
      return this.data[0].url.split(' ');
    }

    return this.data[0].url;
  }

  async key(command_name) {
    const Alias = new utils.Alias(command_name);
    const input = command_name
      .replace(Alias.getRegex(), Alias.getReplacement())
      .replace(regex.invisChar, '');

    this.data = await db.query(
      `
                SELECT *
                FROM api_data
                WHERE tags LIKE ?`,
      [`%${input.split(' ')[1]}%`]
    );

    return this.data[0].key;
  }
}

module.exports = UtilityRepository;
