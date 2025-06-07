const mysql = require('mysql2/promise');
const _ = require('lodash');

const { sqlConfig } = require('../consts/serviceConfigs');
const sleep = require('../utils/sleep');

/**
 * Singleton class for managing MySQL database connections and executing queries.
 */
class SqlClient {
  /**
   * Creates an instance of SqlClient or returns the existing instance.
   * @constructor
   * @param {Object} [customConfig] - Optional custom configuration to override default config
   */
  constructor(customConfig = null) {
    if (!SqlClient.instance) {
      SqlClient.instance = this;
      this._sqlClient = null;
      this.isConnected = false;
      this.customConfig = customConfig;
    } else if (customConfig && !_.isEqual(SqlClient.instance.customConfig, customConfig)) {
      SqlClient.instance._sqlClient = null;
      SqlClient.instance.isConnected = false;
      SqlClient.instance.customConfig = customConfig;
    }

    return SqlClient.instance;
  }

  /**
   * Get the configuration to use for the connection
   * @returns {Object} The SQL configuration object
   */
  getConfig() {
    return this.customConfig || sqlConfig;
  }

  /**
   * Establishes a connection to the MySQL database.
   * If a connection already exists, it returns the existing connection.
   * @returns {Promise<mysql.Connection>} The MySQL connection instance.
   * @throws {Error} If there is an error establishing the connection.
   */
  async connect() {
    if (!this._sqlClient) {
      try {
        const config = this.getConfig();
        this._sqlClient = await mysql.createConnection(config);

        this.isConnected = true;
        console.log('SQL connected with config:', {
          host: config.host,
          database: config.database,
          user: config.user
        });

        this._sqlClient.on('error', error => {
          if (error.fatal) {
            console.log('SQL client error:', error);
            this.isConnected = false;
          }
        });
      } catch (error) {
        this.isConnected = false;
        console.error('SQL connection error:', error);
      }
    }

    return this._sqlClient;
  }

  /**
   * Executes a SQL query with the provided data.
   * Waits for the connection to be established if it hasn't been already.
   * @param {string} query - The SQL query to be executed.
   * @param {Array} [data=[]] - An optional array of data to be formatted into the query.
   * @returns {Promise<Array>} The result of the SQL query.
   * @throws {Error} If there is an error executing the query.
   */
  async query(query, data = []) {
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
  }

  /**
   * Static method to create a new SqlClient instance with custom configuration
   * @param {Object} customConfig - Custom SQL configuration
   * @returns {SqlClient} New SqlClient instance with custom config
   */
  static withCustomConfig(customConfig) {
    SqlClient.instance = null;
    return new SqlClient(customConfig);
  }
}

/**
 * Exports an instance of the SqlClient as a singleton.
 * @type {SqlClient}
 */
module.exports = {
  sqlClient: new SqlClient(),
  SqlClient
};
