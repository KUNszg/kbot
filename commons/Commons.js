const UserRepository = require('./repositories/UserRepository');
const ChannelRepository = require('./repositories/ChannelRepository');
const UtilityRepository = require('./repositories/UtilityRepository');
const CommonRepository = require('./repositories/CommonRepository');

const ServiceConnector = require('./connector/serviceConnector');

let instances = {};

/**
 * Returns a singleton instance of the specified repository class.
 * If the instance does not exist, it creates a new one with the provided sqlClient.
 * @param {UserRepository|{}} RepositoryClass - The repository class to instantiate.
 * @param {Object} sqlClient - The SQL client to pass to the repository constructor.
 * @returns The singleton instance of the specified repository.
 */
function getRepositoryInstance(RepositoryClass, sqlClient) {
  const className = RepositoryClass.name;

  if (!instances[className]) {
    instances[className] = RepositoryClass.getInstance(sqlClient);
  }

  return instances[className];
}

/**
 * Gets the singleton instance of UserRepository.
 * @param {Object} [sqlClient] - The SQL client to pass to the UserRepository constructor.
 * @returns The singleton instance of UserRepository.
 */
function getUserRepositoryInstance(sqlClient) {
  return getRepositoryInstance(UserRepository, sqlClient);
}

/**
 * Gets the singleton instance of ChannelRepository.
 * @param {Object} [sqlClient] - The SQL client to pass to the ChannelRepository constructor.
 * @returns The singleton instance of ChannelRepository.
 */
function getChannelRepositoryInstance(sqlClient) {
  return getRepositoryInstance(ChannelRepository, sqlClient);
}

/**
 * Gets the singleton instance of ChannelRepository.
 * @param {Object} [sqlClient] - The SQL client to pass to the ChannelRepository constructor.
 * @returns The singleton instance of ChannelRepository.
 */
function getUtilityRepositoryInstance(sqlClient) {
  return getRepositoryInstance(UtilityRepository, sqlClient);
}

module.exports = {
  UserRepository: getUserRepositoryInstance,
  ChannelRepository: getChannelRepositoryInstance,
  UtilityRepository: getUtilityRepositoryInstance,
  CommonRepository,
  ServiceConnector,
};
