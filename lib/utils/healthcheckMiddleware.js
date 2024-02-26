const express = require('express');
const _ = require('lodash');

const { healthcheckPath } = require('../../consts/serviceSettings.json');

const healthcheckMiddleware = serviceSettings => {
  const serviceName = _.get(serviceSettings, 'name');
  const servicePort = _.get(serviceSettings, 'port');

  const app = express();

  app.get(healthcheckPath + serviceName, (req, res) => {
    const memoryUsage = process.memoryUsage();

    res.json({
      status: 200,
      message: 'healthy',
      serviceName,
      serviceHeapUsageMB: (memoryUsage.heapUsed / (1024 * 1024)).toFixed(2),
    });
  });

  app.listen(servicePort);
};

module.exports = healthcheckMiddleware;