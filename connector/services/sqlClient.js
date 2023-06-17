const mysql = require("mysql2");
const _ = require('lodash');

const { sqlConfig } = require('../consts/serviceConfigs');

const sleep = require('../utils/sleep');

module.exports.sqlClient = {
  connect: async function () {
    if (process.platform === 'linux') {
      this.sqlConfig.socketPath = '/var/run/mysqld/mysqld.sock';
    }

    global.sqlClient = await mysql.createConnection(sqlConfig);

    global.sqlClient.on('error', err => {
      if (err.fatal) {
        console.log('CONNECTOR ERROR');
        console.log(err);
      }
    });
  },

  query: async (query, data = []) => {
    this.sqlClient = global.sqlClient;

    while (!this.sqlClient) {
      await sleep(1000);
    }

    try {
      const formatQuery = mysql.format(query, data);

      let result = await this.sqlClient.promise().execute(formatQuery);

      result = _.first(result);

      this.sqlClient.unprepare(query);

      return result;
    } catch (err) {
      console.log('CONNECTOR ERROR');
      console.log(err);
    }
  },
};
