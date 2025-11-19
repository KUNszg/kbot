/* eslint-disable @typescript-eslint/no-require-imports */
const { SqlClient } = require('../../../commons/connector/services/sqlClient');
const { sqlConfig } = require('../../../commons/connector/consts/serviceConfigs');
/* eslint-enable @typescript-eslint/no-require-imports */

export interface SqlClientInterface {
  query<T = unknown[]>(query: string, params?: unknown[]): Promise<T>;
  isConnected: boolean;
}

export interface ServiceConnectorType {
  sqlClient: SqlClientInterface;
}

let serviceConnectorInstance: ServiceConnectorType | null = null;

export async function getServiceConnector(): Promise<ServiceConnectorType> {
  if (!serviceConnectorInstance) {
    try {
      const customSqlConfig = {
        ...sqlConfig,
        database: 'kbot_website'
      };

      const sqlClient = SqlClient.withCustomConfig(customSqlConfig);
      await sqlClient.connect();

      serviceConnectorInstance = {
        sqlClient: sqlClient as SqlClientInterface
      };

      console.log(
        'ServiceConnector initialized for Next.js with database:',
        customSqlConfig.database
      );
    } catch (error) {
      console.error('Failed to initialize SQL Client:', error);
      throw error;
    }
  }

  return serviceConnectorInstance;
}

export default getServiceConnector;
