const requireDir = require('require-dir');
const _ = require('lodash');
const moment = require('moment-timezone');

moment.tz.setDefault('ETC/UTC');

const Commons = require('../../commons/Commons');

const ERROR_QUEUE = process.env.ERROR_QUEUE || 'KB_JOB_MANAGER_TASK_EXECUTION_ERROR';

(async () => {
  const kb = await Commons.ServiceConnector.Connector.dependencies([
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
    `);

    const tasksDir = requireDir('./tasks', { extensions: ['.js'] });

    for (const incomingTask of tasks) {
      const taskName = _.get(incomingTask, 'task');
      const task = _.find(tasksDir, item => item.name === taskName);

      const taskCompleted = await new Promise(async resolve => {
        try {
          await task(kb);
          resolve({ success: true });
        } catch (err) {
          console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err.message}`);
          resolve({ success: false });
        }
      });

      if (_.get(taskCompleted, 'success')) {
        await kb.sqlClient.query(
          `UPDATE global_tasks SET last_finished=CURRENT_TIMESTAMP, failures=? WHERE id=?`,
          [0, incomingTask.id]
        );
      } else {
        await kb.rabbitClient.sendToQueue(
          ERROR_QUEUE,
          JSON.stringify({
            incomingTask,
          })
        );

        await kb.sqlClient.query(
          `UPDATE global_tasks SET last_finished=CURRENT_TIMESTAMP, failures=? WHERE id=?`,
          [++incomingTask.failures, incomingTask.id]
        );
      }
    }

    setTimeout(taskManager, 2000);
  };

  await taskManager();
})();
