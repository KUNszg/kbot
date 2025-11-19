const _ = require('lodash');

/**
 * CommonRepository class provides utility methods for interacting with a database.
 * It includes methods for querying data, checking the existence of records,
 * and extracting relevant information from input objects.
 */
class CommonRepository {
  static botUsername = 'ksyncbot';
  static botOwnerId = 75;

  static table = {
    user_list: 'user_list',
    trusted_users: 'trusted_users',
    ban_list: 'ban_list',
    optout: 'optout',
    mention_bans: 'mention_bans',
    channels: 'channels',
  };

  /**
   * Creates an instance of CommonRepository.
   * @param serviceConnector - Client connection manager.
   */
  constructor(serviceConnector) {
    this.serviceConnector = serviceConnector;
  }

  /**
   * Retrieves records from a table based on a specific field and its value.
   * @param tableName - The name of the table to query.
   * @param fieldName - The name of the field to filter by.
   * @param fieldValue - The value of the field to filter by.
   * @returns Resolves to the result set of the query.
   */
  async _getByField(tableName, fieldName, fieldValue) {
    return await this.serviceConnector.sqlClient.query(
      `
      SELECT *
      FROM ${tableName}
      WHERE ${fieldName}=?`,
      [fieldValue]
    );
  }

  /**
   * Checks if a record exists in the specified table based on multiple fields and their values.
   * @param tableName - The name of the table to query.
   * @param fields - An object containing field names as keys and their corresponding values to filter by.
   * @returns Resolves to true if the record exists, otherwise false.
   */
  async _exists(tableName, fields) {
    if (!fields || _.keys(fields).length === 0) {
      return false;
    }

    const conditions = _.keys(fields)
      .map(fieldName => `${fieldName}=?`)
      .join(' AND ');
    const values = _.values(fields);

    const queryResult = await this.serviceConnector.sqlClient.query(
      `
      SELECT EXISTS(
        SELECT 1
        FROM ${tableName}
        WHERE ${conditions}
      ) AS isExisting`,
      values
    );

    return _.get(_.first(queryResult), 'isExisting') === 1;
  }

  /**
   * Extracts identifiers from an input object.
   * @param userstate - The user object.
   * @param [userstate.user-id] - The user's ID.
   * @param [userstate.username] - The user's username.
   * @returns An object containing the extracted userId and username.
   */
  _extractUserIdentifiers(userstate) {
    const userId = _.get(userstate, 'user-id') || _.get(userstate, 'userId');
    const username = _.toLower(_.get(userstate, 'username'));

    return { userId, username };
  }
}

module.exports = CommonRepository;
