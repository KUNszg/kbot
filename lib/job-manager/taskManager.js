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

  const tasksDir = requireDir('./tasks', { extensions: ['.js'] });

  const startTaskLoop = async (task, incomingTask) => {
    const taskName = _.get(incomingTask, 'task');
    const taskId = _.get(incomingTask, 'id');
    const intervalMs = _.get(incomingTask, 'interval_ms');

    const taskLoop = async () => {
      const lastFinished = await kb.sqlClient.query(
        `
            SELECT last_finished, interval_ms, failures
            FROM global_tasks
            WHERE id = ?
        `,
        [taskId]
      );

      const lastFinishedTime = _.get(lastFinished, '0.last_finished');
      const currentTime = moment();
      const timeDiff = currentTime.diff(moment(lastFinishedTime), 'milliseconds');
      const failures = _.get(lastFinished, '0.failures');

      if (failures >= 10) {
        console.log(
          `${moment().format(
            'YYYY-MM-DD HH:mm:ss'
          )}: Task ${taskName} (${taskId}) skipped due to failure limit reached.`
        );
        return;
      }

      if (timeDiff < intervalMs) {
        const delay = intervalMs - timeDiff;
        setTimeout(taskLoop, delay);
        return;
      }

      try {
        await task(kb);

        console.log(
          `${moment().format(
            'YYYY-MM-DD HH:mm:ss'
          )}: Task ${taskName} (${taskId}) completed successfully`
        );

        await kb.sqlClient.query(
          `UPDATE global_tasks SET last_finished=CURRENT_TIMESTAMP, failures=? WHERE id=?`,
          [0, taskId]
        );
      } catch (err) {
        console.log(
          `${moment().format('YYYY-MM-DD HH:mm:ss')}: Task ${taskName} (${taskId}) failed: ${
            err.message
          }`
        );

        await kb.rabbitClient.sendToQueue(ERROR_QUEUE, JSON.stringify({ task: incomingTask }));

        await kb.sqlClient.query(
          `UPDATE global_tasks SET last_finished=CURRENT_TIMESTAMP, failures=? WHERE id=?`,
          [failures + 1, taskId]
        );
      }

      setTimeout(taskLoop, intervalMs);
    };

    taskLoop();
  };

  const tasks = await kb.sqlClient.query(`
    SELECT *
    FROM global_tasks
    WHERE active="1"
  `);

  for (const incomingTask of tasks) {
    const taskName = _.get(incomingTask, 'task');
    const task = _.find(tasksDir, item => item.name === taskName);

    if (task) {
      startTaskLoop(task, incomingTask);
    }
  }
})();
