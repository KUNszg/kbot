/* eslint-disable @typescript-eslint/no-require-imports */
const { SqlClient } = require('commons/connector/services/sqlClient');
const { sqlConfig } = require('commons/connector/consts/serviceConfigs');
const { redisClient } = require('commons/connector/services/redisClient');
/* eslint-enable @typescript-eslint/no-require-imports */

export interface SqlClientInterface {
  query<T = unknown[]>(query: string, params?: unknown[]): Promise<T>;
  isConnected: boolean;
}

export interface RedisClientInterface {
  get(key: string): Promise<unknown>;
  isConnected: boolean;
}

export interface ServiceConnectorType {
  sqlClient: SqlClientInterface;
  redisClient: RedisClientInterface;
}

let serviceConnectorInstance: ServiceConnectorType | null = null;

export async function getServiceConnector(): Promise<ServiceConnectorType> {
  if (!serviceConnectorInstance) {
    try {
      const config = {
        ...sqlConfig,
        debug: false
      };

      const sqlClient = SqlClient.withCustomConfig(config);
      await sqlClient.connect();
      await redisClient.connect();

      if (!redisClient.isConnected) {
        throw new Error(
          'Redis connection failed (check redisHost/redisPort are set for this deployment)'
        );
      }

      serviceConnectorInstance = {
        sqlClient: sqlClient as SqlClientInterface,
        redisClient: redisClient as RedisClientInterface
      };

      console.log('ServiceConnector initialized');
    } catch (error) {
      console.error('Failed to initialize ServiceConnector:', error);
      throw error;
    }
  }

  return serviceConnectorInstance;
}

export default getServiceConnector;
