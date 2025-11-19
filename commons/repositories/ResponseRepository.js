const responses = require('../../consts/responses');

const CommonRepository = require('./CommonRepository');

class ResponseRepository extends CommonRepository {
  constructor(serviceConnector = {}) {
    super(serviceConnector);
  }

  static getInstance(serviceConnector) {
    if (!ResponseRepository.instance) {
      ResponseRepository.instance = new ResponseRepository(serviceConnector);
    }
    return ResponseRepository.instance;
  }

  getResponses() {
    return responses;
  }
}

module.exports = ResponseRepository;
