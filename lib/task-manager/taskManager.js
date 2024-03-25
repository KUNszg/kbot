const requireDir = require('require-dir');
const _ = require('lodash');
const moment = require('moment-timezone');

moment.tz.setDefault('Europe/Warsaw');

const serviceConnector = require('../../connector/serviceConnector');

const ERROR_QUEUE = process.env.ERROR_QUEUE || 'KB_TASK_MANAGER_TASK_EXECUTION_ERROR';

(async () => {
  const kb = await serviceConnector.Connector.dependencies([
    'sql',
    'rabbit',
    'redis',
    'websocket',
    'tmi',
  ]);

  const taskManager = async () => {
    const tasks = await kb.sqlClient.query(`
    SELECT *
    FROM global_tasks 
    WHERE active="1"
        AND TIMESTAMPDIFF(SECOND, last_finished, CURRENT_TIMESTAMP) > interval_ms / 1000
    LIMIT 15
    `);

    const tasksDir = requireDir('./tasks', { extensions: ['.js'] });

    for (const incomingTask of tasks) {
      const taskName = _.get(incomingTask, 'task');
      const task = _.find(tasksDir, item => item.name === taskName);

      const taskCompleted = await new Promise(async (resolve, reject) => {
        try {
          await task(kb);
          resolve({ success: true });
        } catch (err) {
          reject(err);
        }
      }).catch(async err => {
        err.message = `${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err.message}`;

        console.log(err);

        await kb.rabbitClient.sendToQueue(
          ERROR_QUEUE,
          JSON.stringify({
            err,
            incomingTask,
          })
        );

        await kb.sqlClient.query(
          `UPDATE global_tasks SET last_finished=CURRENT_TIMESTAMP WHERE id=? AND failures=?`,
          [incomingTask.id, incomingTask.failures++]
        );
      });

      if (_.get(taskCompleted, 'success')) {
        await kb.sqlClient.query(
          `UPDATE global_tasks SET last_finished=CURRENT_TIMESTAMP WHERE id=?`,
          [incomingTask.id]
        );
      }
    }

    setTimeout(taskManager, 2000);
  };

  await taskManager();
})();

// TODO: healthcheck with expressjs
