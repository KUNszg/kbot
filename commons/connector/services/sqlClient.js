const mysql = require('mysql2/promise');
const _ = require('lodash');

const { sqlConfig } = require('../consts/serviceConfigs');
const sleep = require('../utils/sleep');

class SqlClient {
  constructor(customConfig = null) {
    if (!SqlClient.instance) {
      SqlClient.instance = this;
      this._sqlPool = null;
      this.isConnected = false;
      this.customConfig = customConfig;
    } else if (customConfig && !_.isEqual(SqlClient.instance.customConfig, customConfig)) {
      if (SqlClient.instance._sqlPool) {
        SqlClient.instance._sqlPool.end();
      }
      SqlClient.instance._sqlPool = null;
      SqlClient.instance.isConnected = false;
      SqlClient.instance.customConfig = customConfig;
    }

    return SqlClient.instance;
  }

  getPoolConfig() {
    const baseConfig = this.customConfig || sqlConfig;

    return {
      host: baseConfig.host,
      user: baseConfig.user,
      password: baseConfig.password,
      database: baseConfig.database,
      port: baseConfig.port,
      charset: baseConfig.charset || 'utf8mb4',
      timezone: baseConfig.timezone || 'Z',
      multipleStatements: false,
      dateStrings: false,
      debug: baseConfig.debug || false,
      trace: false,
      typeCast:
        baseConfig.typeCast ||
        function (field, next) {
          if (field.type === 'TINY' && field.length === 1) {
            return field.string() === '1';
          }
          return next();
        },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      idleTimeout: 300000,
      maxIdle: 10
    };
  }

  async connect() {
    if (!this._sqlPool) {
      try {
        const config = this.getPoolConfig();
        this._sqlPool = mysql.createPool(config);

        await this._sqlPool.execute('SELECT 1');

        this.isConnected = true;

        console.log('[Connector-SQL] Connection pool created and tested successfully');

        this._sqlPool.on('connection', connection => {
          console.log(
            `[Connector-SQL] New connection established (ID: ${connection.threadId})`
          );
        });

        this._sqlPool.on('error', error => {
          console.error('[Connector-SQL] Pool error:', error);
          if (error.code === 'PROTOCOL_CONNECTION_LOST') {
            this.isConnected = false;
          }
        });
      } catch (error) {
        this.isConnected = false;
        console.error('[Connector-SQL] Connection pool creation error:', error);
        throw error;
      }
    }

    return this._sqlPool;
  }

  async query(query, data = []) {
    while (!this._sqlPool) {
      await sleep(100);
    }

    if (!this._sqlPool) {
      throw new Error('SQL connection pool not available');
    }

    try {
      const [result] = await this._sqlPool.execute(query, data);
      return result;
    } catch (error) {
      console.error('[Connector-SQL] Query error:', error);

      if (error.message && error.message.includes('closed state')) {
        console.warn('[Connector-SQL] Database connection closed, retrying...');
        this.isConnected = false;
        await this.connect();
        const [result] = await this._sqlPool.execute(query, data);
        return result;
      }

      throw error;
    }
  }

  async isHealthy() {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.warn('[Connector-SQL] Health check failed:', error.message);
      return false;
    }
  }

  async close() {
    if (this._sqlPool) {
      console.log('[Connector-SQL] Closing connection pool...');
      await this._sqlPool.end();
      this._sqlPool = null;
      this.isConnected = false;
      console.log('[Connector-SQL] Connection pool closed');
    }
  }

  static withCustomConfig(customConfig) {
    SqlClient.instance = null;
    return new SqlClient(customConfig);
  }
}

module.exports = {
  sqlClient: new SqlClient(),
  SqlClient
};
