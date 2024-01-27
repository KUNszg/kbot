const got = require('got');
const _ = require('lodash');
const childProcess = require('child_process');

const config = require('../lib/credentials/config');

const PORT = process.env.PORT || 8080;

const sleep = time => {
  return new Promise(resolve => setTimeout(resolve, time));
};

const request = endpoint => {
  return got('http://localhost' + endpoint, {
    port: PORT,
  });
};

beforeAll(async () => {
  childProcess.exec(config.puttyExecutable);

  await sleep(3000);

  require('./api');

  await sleep(3000);
}, 30000);

describe('Integration tests', () => {
  test('healthcheckGet_WhenResourceRequested_Returns200AndOK', async () => {
    const response = await request('/healthcheck');

    expect(response.body).toBe('OK');
    expect(response.statusCode).toBe(200);
  });

  describe('API', () => {
    test('channelsGet_WhenResourceRequested_ReturnsListOfChannels', async () => {
      const response = await request('/api/channels').json();

      const responseDataSize = _.size(_.get(response, 'data'));

      expect(responseDataSize).toBeGreaterThan(0);
    });

    test('statsGet_WhenResourceRequested_ReturnsObjectWithStats', async () => {
      const response = await request('/api/stats').json();

      expect(_.isEmpty(response)).toBeFalsy();
    });

    test('userGet_WhenResourceRequested_ReturnsListOfUserNameHistory', async () => {
      const response = await request('/api/user?username=eppunen').json();

      const responseDataSize = _.size(_.get(response, "nameHistory"));

      expect(responseDataSize).toBeGreaterThan(0);
    });

    test('randomEmoteGet_WhenResourceRequested_ReturnsListOfRandomTwitchEmotes', async () => {
      const response = await request('/randomemote').json();

      const responseDataSize = _.size(response);

      expect(responseDataSize).toBeGreaterThan(0);
    });
  });
});

afterAll(
  () =>
    setTimeout(async () => {
      childProcess.exec('taskkill /IM putty.exe /t /f');

      await sleep(3000);

      process.exit();
    }, 1000),
  30000
);
