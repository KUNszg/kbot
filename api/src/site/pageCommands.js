const Table = require('table-builder');
const _ = require('lodash');
const fs = require('fs');

const utils = require('../../../lib/utils/utils');

const prepareCommandsRow = require('../../utils/prepareCommandsRow');

const pageCommands = services => {
  const { app, kb } = services;

  app.get('/commands', async (req, res) => {
    const commands = await kb.sqlClient.query(`
        SELECT *
        FROM commands
        WHERE permissions < 5
        ORDER BY command
        ASC`);

    const tableData = prepareCommandsRow(commands);

    const headers = {
      ID: ` <div class='table-headers'>ID</div> `,
      command: ` <div class='table-headers'>command</div> `,
      cooldown: ` <div class='table-headers'>cooldown</div> `,
      'opt-out': ` <div class='table-headers'>opt-out</div> `,
      code: ` <div class='table-headers'>code</div> `,
      usage: ` <div class='table-headers'>usage</div> `,
      description: ` <div class='table-headers'>description</div> `,
    };

    const table = new Table({ class: 'table-context' })
      .setHeaders(headers)
      .setData(tableData)
      .render();

    const html = _.toString(
      fs.readFileSync('../../kbot-website/html/express_pages/commands.html')
    );

    const page = new utils.Swapper(html, [
      {
        table,
      },
    ]);

    res.send(page.template());
  });
};

module.exports = pageCommands;
