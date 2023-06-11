const _ = require('lodash');
const prepareCommandsRow = commands => {
  let tableData = [];

  _.forEach(commands, (command, id) => {
    const commandDesc = _.replace(
      _.get(command, 'description'),
      /-/g,
      ' - <details><summary>[...] </summary>'
    ) + "</details>";

    const commandUsage = _.replace(_.get(command, 'usage') ?? 'NULL', /;/g, '<br>');
    const commandText = _.get(command, 'command');
    const commandCooldown = _.get(command, 'cooldown', 0) / 1000;
    const commandOptoutable = _.get(command, 'optoutable') === 'Y' ? '✅' : '❌';

    const inline = `class='table-contents' style='text-align: center;'`;
    const buttonDiv = `<div class='code' style="font-family: 'Noto Sans', sans-serif; font-size: 13px;">
      <img style='margin-top: 10px; margin-bottom: 5px;' src='https://i.imgur.com/1THd3GD.png' height='15' width='15' alt='Error displaying image'>
    </div>`;

    tableData.push({
      ID: `<div ${inline}>${id}</div>`,
      command: `<div ${inline}>${commandText}</div>`,
      cooldown: `<div ${inline}>${commandCooldown}s</div>`,
      'opt-out': `<div ${inline}>${commandOptoutable}</div>`,
      code: `<a href='https://kunszg.com/commands/code/${commandText}'>${buttonDiv}</a>`,
      usage: `<div class='table-contents usage-div'><span style='cursor: auto;'>${commandUsage}</span></div>`,
      description: `<div class='table-contents'><div class='limiter'>${commandDesc}</div></div>`,
    });
  });

  return tableData;
};

module.exports = prepareCommandsRow;
