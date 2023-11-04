const mysql = require("mysql2/promise");
const _ = require('lodash');

const { sqlConfig } = require('../consts/serviceConfigs');

const sleep = require('../utils/sleep');

const sqlClient = {
  connect: async function () {
    if (process.platform === 'linux') {
      this.sqlConfig.socketPath = '/var/run/mysqld/mysqld.sock';
    }

    global._sqlClient = await mysql.createConnection(sqlConfig);

    sqlClient.native = global._sqlClient;

    global._sqlClient.on('error', err => {
      if (err.fatal) {
        console.log('CONNECTOR ERROR');
        console.log(err);
      }
    });
  },

  query: async (query, data = []) => {
    this._sqlClient = global._sqlClient;

    while (!this._sqlClient) {
      await sleep(1000);
    }

    try {
      const formatQuery = mysql.format(query, data);

      let result = await this._sqlClient.execute(formatQuery);

      result = _.first(result);

      this._sqlClient.unprepare(query);

      return result;
    } catch (err) {
      console.log('CONNECTOR ERROR');
      console.log(err);
    }

    return null;
  },
};

module.exports.sqlClient = sqlClient;