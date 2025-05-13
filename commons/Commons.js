const UserRepository = require('./repositories/UserRepository');
const ChannelRepository = require('./repositories/ChannelRepository');
const UtilityRepository = require('./repositories/UtilityRepository');
const ResponseRepository = require('./repositories/ResponseRepository');

const CommonRepository = require('./repositories/CommonRepository');

const ServiceConnector = require('./connector/serviceConnector');

let instances = {};

/**
 * Returns a singleton instance of the specified repository class.
 * If the instance does not exist, it creates a new one with the provided serviceConnector.
 * @param {UserRepository|{}} RepositoryClass - The repository class to instantiate.
 * @param {Object} serviceConnector - Client connection manager.
 * @returns The singleton instance of the specified repository.
 */
function getRepositoryInstance(RepositoryClass, serviceConnector) {
  const className = RepositoryClass.name;

  if (!instances[className]) {
    instances[className] = RepositoryClass.getInstance(serviceConnector);
  }

  return instances[className];
}

/**
 * Gets the singleton instance of UserRepository.
 * @param {Object} [serviceConnector] - Client connection manager.
 * @returns The singleton instance of UserRepository.
 */
function getUserRepositoryInstance(serviceConnector) {
  return getRepositoryInstance(UserRepository, serviceConnector);
}

/**
 * Gets the singleton instance of ChannelRepository.
 * @param {Object} [serviceConnector] - Client connection manager.
 * @returns The singleton instance of ChannelRepository.
 */
function getChannelRepositoryInstance(serviceConnector) {
  return getRepositoryInstance(ChannelRepository, serviceConnector);
}

/**
 * Gets the singleton instance of UtilityRepository.
 * @param {Object} [serviceConnector] - Client connection manager.
 * @returns The singleton instance of UtilityRepository.
 */
function getUtilityRepositoryInstance(serviceConnector) {
  return getRepositoryInstance(UtilityRepository, serviceConnector);
}

/**
 * Gets the singleton instance of ResponseRepository.
 * @param {Object} [serviceConnector] - Client connection manager.
 * @returns The singleton instance of ResponseRepository.
 */
function getResponseRepositoryInstance(serviceConnector) {
  return getRepositoryInstance(ResponseRepository, serviceConnector);
}

module.exports = {
  UserRepository: getUserRepositoryInstance,
  ChannelRepository: getChannelRepositoryInstance,
  UtilityRepository: getUtilityRepositoryInstance,
  ResponseRepository: getResponseRepositoryInstance,
  CommonRepository,
  ServiceConnector
};
