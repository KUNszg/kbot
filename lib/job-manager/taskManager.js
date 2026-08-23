const requireDir = require('require-dir');
const _ = require('lodash');
const moment = require('moment-timezone');

moment.tz.setDefault('ETC/UTC');

const Commons = require('../../commons/Commons');
const { startHeartbeat } = require('../../commons/connector/utils/heartbeat');
const config = require('../../lib/credentials/config');

const ERROR_QUEUE = process.env.ERROR_QUEUE || 'KB_JOB_MANAGER_TASK_EXECUTION_ERROR';
const TASK_DISCOVERY_INTERVAL_MS = 60000;

(async () => {
  const kb = await Commons.ServiceConnector.Connector.dependencies(
    ['sql', 'rabbit', 'redis', 'websocket', 'tmi'],
    {
      disableTMIAutojoin: true
    }
  );

  startHeartbeat(kb, 'kbot-job-manager');

  const tasksDir = requireDir('./tasks', { extensions: ['.js'] });
  const runningTaskIds = new Set();

  const startTaskLoop = (task, incomingTask) => {
    const taskName = _.get(incomingTask, 'task');
    const taskId = _.get(incomingTask, 'id');
    const intervalMs = _.get(incomingTask, 'interval_ms');

    runningTaskIds.add(taskId);

    const taskLoop = async () => {
      const lastFinished = await kb.sqlClient.query(
        `
            SELECT last_finished, interval_ms, failures
            FROM global_tasks
            WHERE id = ? AND active = ?
        `,
        [taskId, true]
      );

      if (_.isEmpty(lastFinished)) {
        console.log(
          `${moment().format(
            'YYYY-MM-DD HH:mm:ss'
          )}: Task ${taskName} (${taskId}) deactivated, stopping loop.`
        );
        runningTaskIds.delete(taskId);
        return;
      }

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
        runningTaskIds.delete(taskId);
        return;
      }

      if (timeDiff < intervalMs) {
        const delay = intervalMs - timeDiff;
        setTimeout(taskLoop, delay);
        return;
      }

      try {
        await task(kb, config);

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

  const discoverTasks = async () => {
    const tasks = await kb.sqlClient.query(
      `
      SELECT *
      FROM global_tasks
      WHERE active = ?
    `,
      [true]
    );

    for (const incomingTask of tasks) {
      const taskId = _.get(incomingTask, 'id');

      if (runningTaskIds.has(taskId)) continue;

      const taskName = _.get(incomingTask, 'task');
      const task = _.find(tasksDir, item => item.name === taskName);

      if (task) {
        console.log(
          `${moment().format(
            'YYYY-MM-DD HH:mm:ss'
          )}: Task ${taskName} (${taskId}) activated, starting loop.`
        );
        startTaskLoop(task, incomingTask);
      }
    }
  };

  await discoverTasks();
  setInterval(discoverTasks, TASK_DISCOVERY_INTERVAL_MS);
})();
