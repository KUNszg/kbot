#!/usr/bin/env node
'use strict';

const express = require('express');
const fs = require('fs');
const got = require('got');
const shell = require('child_process');
const Table = require('table-builder');
const requireDir = require('require-dir');
const _ = require('lodash');

const creds = require('../lib/credentials/config.js');
const utils = require('../lib/utils/utils.js');
const init = require('../lib/utils/connection.js');

const GithubWebHook = require('../lib/utils/git-webhook-middleware.js');
const expressSetup = require('./utils/expressSetup');

const app = express();

const kb = new init.IRC();
const redisClient = init.Redis;

const secret = creds.webhook_github_secret;
const webhookHandler = GithubWebHook({ path: '/webhooks/github', secret: secret });

expressSetup(app, webhookHandler);

const endpoints = requireDir('src', { recurse: true });

(async () => {
  await kb.tmiConnect();
  kb.sqlConnect();
  await redisClient.connect();

  const initializeMethodRecurse = (method, params) => {
    if (_.isPlainObject(method)) {
      _.forEach(method, invocation => {
        initializeMethodRecurse(invocation, params);
      });
    }
    else {
      method(params);
    }
  };

  _.forEach(endpoints, invocation => {
    initializeMethodRecurse(invocation, { kb, redisClient, app, webhookHandler });
  });

  app.get('/commands', async (req, res) => {
    const commands = await kb.query(`
        SELECT *
        FROM commands
        WHERE permissions < 5
        ORDER BY command
        ASC`);

    const tableData = [];
    for (let i = 0; i < commands.length; i++) {
      const desc =
        commands[i].description.replace(' - ', ' - <details><summary>[...] </summary>') +
        '</details>';

      let usage = commands[i].usage ?? 'NULL';

      usage = usage.replace(/;/g, '<br>');

      tableData.push({
        ID: `<div class="table-contents" style="text-align: center;">${i + 1}</div>`,
        command: `<div class="table-contents" style="text-align: center;">${commands[i].command}</div>`,
        cooldown: `<div class="table-contents" style="text-align: center;">${
          commands[i].cooldown / 1000
        }s</div>`,
        'opt-out': `<div class="table-contents" style="text-align: center;">${
          commands[i].optoutable === 'Y' ? '✅' : '❌'
        }</div>`,
        code: `<a href="https://kunszg.com/commands/code/${commands[i].command}">
                        <div class="code" style="font-family: 'Noto Sans', sans-serif; font-size: 13px;">
                                <img style="margin-top: 10px; margin-bottom: 5px;" src="https://i.imgur.com/1THd3GD.png" height="15" width="15">
                        </div>
                    </a>`,
        usage: `<div class="table-contents usage-div"><span style="cursor: auto;">${usage}</span></div>`,
        description: `<div class="table-contents"><div class="limiter">${desc}</div></div>`,
      });
    }

    const headers = {
      ID: ` <div class="table-headers">ID</div> `,
      command: ` <div class="table-headers">command</div> `,
      cooldown: ` <div class="table-headers">cooldown</div> `,
      'opt-out': ` <div class="table-headers">opt-out</div> `,
      code: ` <div class="table-headers">code</div> `,
      usage: ` <div class="table-headers">usage</div> `,
      description: ` <div class="table-headers">description</div> `,
    };

    res.send(
      `<!DOCTYPE html>
      	<html>
      		<head>
          		<title>commands</title>
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                <link rel="stylesheet" type="text/css" href="https://kunszg.com/express_pages/styles/style_commands.css">
      		</head>
      		<body style="background-color: #1a1a1a">
                <div style="color: lightgray;">
	          		${new Table({ class: 'table-context' })
                  .setHeaders(headers)
                  .setData(tableData)
                  .render()}
                </div>
			</body>
		</html>
	    `
    );
  });

  app.get('/commands/code/*', async (req, res) => {
    const query = req.url.split('/')[3];

    if (query) {
      try {
        const requestedFile = fs.readFileSync(`./lib/commands/${query}.js`);
        res.send(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                        <link href="https://kunszg.com/prism.css" rel="stylesheet" />
                        <title>${query} command code</title>
                        <link rel="preconnect" href="https://fonts.gstatic.com">
                        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" rel="stylesheet">
                        <style>
                            .parameter {
                                color: orange;
                                font-style: italic;
                            }
                        </style>
                    </head>
                    <body style="background-color: #272822;">
                        <h3 style="color: gray;">Code for ${query} command</h3><br>
                        <pre style="font-size: 13px;" class="line-numbers"><code class="language-js">${requestedFile}</code></pre>
                        <script src="https://kunszg.com/prism.js"></script>
                    </body>
                </html>
                `);
      } catch (err) {
        res.send('<h3>Error: command not found</h3>');
      }
    } else {
      res.send('<h3>Error: command not found</h3>');
    }

    return;
  });

  // bot request form

  app.get('/request', async (req, res) => {
    const commands = await kb.query(`
        SELECT *
        FROM commands
        WHERE permissions < 5
        ORDER BY command
        ASC`);

    const createSelectAll = () => {
      let selectSwitch = '';

      for (let i = 0; i < commands.length; i++) {
        selectSwitch += document.getElementById(`checkset${i}`).disabled = this.checked;
      }

      return selectSwitch;
    };

    const createCommandList = () => {
      let commandSwitch = `<div id="container">`;

      for (let i = 0; i < commands.length; i++) {
        commandSwitch += `
            <div class="form-check form-switch item">
                <input class="form-check-input" name="${i}" type="checkbox" id="checkset${i}">
                <label class="form-check-label" for="checkset" style="color: white;">${commands[i].command}</label>
            </div>`;
      }

      return commandSwitch + '</div>';
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <!-- Required meta tags -->
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- Bootstrap CSS -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-giJF6kkoqNQ00vy+HMDP7azOuL0xtbfIcaT9wjKHr8RbDVddVHyTfAAsrekwKmP1" crossorigin="anonymous">

        <title>Add KsyncBot to your channel</title>
        <style>
            #container {
                column-count: 3;
            }
            .item {
                break-inside: avoid-column;
            }
            .item:nth-of-type(2){
                break-after:column;
                display:block;
            }
        </style>
    </head>
    <body style="background-color: #1a1a1a; margin-left: 5vw; margin-right: 5vw;">
    <form>
        <div class="form-row">
            <div class="col-md-4 mb-3">
                <label for="validationServerUsername" style="color: white">Username</label>
                <div class="input-group" style="width: 10vw">
                    <div class="input-group-prepend">
                    </div>
                    <input type="text" class="form-control is-invalid" name="username" id="validationServerUsername" placeholder="Username" aria-describedby="inputGroupPrepend3" required>
                        <div class="invalid-feedback">
                            Please choose a username.
                        </div>
                </div>
            </div>
        </div>
        <hr style="background-color: white;">
            ${createSelectAll()}
            <br>
            ${createCommandList()}
            <br>
            <button class="btn btn-primary" type="submit">Submit form</button>
    </form>
    <!-- Optional JavaScript -->
    <!-- jQuery first, then Popper.js, then Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.bundle.min.js" integrity="sha384-ygbV9kiqUc6oa4msXn9868pTtWMgiQaeYH7/t7LECLbyPA2x65Kgf80OJFdroafW" crossorigin="anonymous"></script>
    </body>
</html>`;

    res.send(html);
  });

  app.get('/emotes', async (req, res) => {
    const tableData = [];
    const tableDataRemoved = [];
    const headers = {
      ID: " <div class='table-headers'>ID</div> ",
      name: `<div class='table-headers'>name</div>`,
      emote: " <div class='table-headers'>emote</div> ",
      type: " <div class='table-headers'>type</div> ",
      added: " <div class='table-headers'>added</div> ",
    };

    const headersRemoved = {
      ID: " <div class='table-headers'>ID</div> ",
      name: `<div class='table-headers'>name</div>`,
      emote: " <div class='table-headers'>emote</div> ",
      type: " <div class='table-headers'>type</div> ",
      removed: " <div class='table-headers'>removed</div> ",
    };

    let homepage = fs.readFileSync('../kbot-website/html/express_pages/emotes.html');

    homepage = homepage.toString();

    if (!req.query.search) {
      res.send(homepage);
      return;
    }

    if ((await req.query?.search) ?? false) {
      const emotes = await kb.query(
        `
            SELECT *
            FROM emotes
            WHERE channel=?
            ORDER BY date
            DESC`,
        [!req.query.search ? 'asdf' : req.query.search.toLowerCase()]
      );

      const emotesRemoved = await kb.query(
        `
            SELECT *
            FROM emotes_removed
            WHERE channel=?
            ORDER BY date
            DESC`,
        [!req.query.search ? 'asdf' : req.query.search.toLowerCase()]
      );

      const formatDate = timestamp => {
        const time = Date.now() - Date.parse(timestamp);
        return `${utils.humanizeDuration(time / 1000)} ago`;
      };

      class ModifyOutput {
        constructor(input) {
          this.input = input;
        }

        trimmer() {
          return this.input.length > 20 ? `${this.input.substr(0, 20)}(...)` : this.input;
        }
      }

      if (!emotes.length) {
        res.send(homepage);
      } else {
        for (let i = 0; i < emotes.length; i++) {
          const emoteName = new ModifyOutput(emotes[i].emote);

          let emoteCDN = '#';
          if (emotes[i].url != null) {
            if (emotes[i].type === 'bttv') {
              emoteCDN = emotes[i].url
                .replace('https://cdn.betterttv.net/emote/', 'https://betterttv.com/emotes/')
                .replace('/1x', '');
            } else if (emotes[i].type === 'ffz') {
              emoteCDN = `https://www.frankerfacez.com/emoticon/${emotes[i].emoteId}-${emotes[i].emote}`;
            } else if (emotes[i].type === '7tv') {
              emoteCDN = `https://7tv.app/emotes/${emotes[i].sevenTvId}`;
            }
          }

          tableData.push({
            ID: `<div class="table-contents" style="text-align: center;">${i + 1}</div>`,
            name: `<div class="table-contents" style="text-align: center;">
                            <a target="_blank" style="color: inherit; text-decoration: none;" href="${emoteCDN}">
                                ${emoteName.trimmer()}
                            </a>
                            </div>`,
            emote: `<div class="table-contents" style="text-align: center;">
                                <a target="_blank" style="color: inherit; text-decoration: none;" href="${emoteCDN}">
                                    <span title="${emotes[i].emote}">
                                        <img style="vertical-align: middle; margin-top: 4px; margin-bottom: 4px;" loading="lazy" src="${
                                          emotes[i].url
                                        }" alt="${emoteName.trimmer()}">
                                    </span>
                                </a>
                            </div>`,
            type: `<div class="table-contents" style="text-align: center;">${emotes[i].type}</div>`,
            added: `<div class="table-contents" style="text-align: center;">${formatDate(
              emotes[i].date
            )}</div>`,
          });
        }
      }

      if (!emotesRemoved.length) {
        tableDataRemoved.push({
          ID: `<div class="table-contents" style="text-align: center;">-</div>`,
          name: `<div class="table-contents" style="text-align: center;">-</div>`,
          emote: `<div class="table-contents" style="text-align: center;">-</div>`,
          type: `<div class="table-contents" style="text-align: center;">-</div>`,
          removed: `<div class="table-contents" style="text-align: center;">-</div>`,
        });
      } else {
        for (let i = 0; i < emotesRemoved.length; i++) {
          const emoteName = new ModifyOutput(emotesRemoved[i].emote);

          let emoteCDN = '#';

          if (emotesRemoved[i].url != null) {
            if (emotesRemoved[i].type === 'bttv') {
              emoteCDN = emotesRemoved[i].url
                .replace('https://cdn.betterttv.net/emote/', 'https://betterttv.com/emotes/')
                .replace('/1x', '');
            } else if (emotesRemoved[i].type === 'ffz') {
              emoteCDN = `https://www.frankerfacez.com/emoticon/${emotesRemoved[i].emoteId}-${emotesRemoved[i].emote}`;
            } else if (emotesRemoved[i].type === '7tv') {
              emoteCDN = `https://7tv.app/emotes/${emotesRemoved[i].sevenTvId}`;
            }
          }

          tableDataRemoved.push({
            ID: `<div class="table-contents" style="text-align: center;">${i + 1}</div>`,
            name: `<div class="table-contents" style="text-align: center;">
                                <a target="_blank" style="color: inherit; text-decoration: none;" href="${emoteCDN}">
                                    ${emoteName.trimmer()}
                                </a>
                            </div>`,
            emote: `<div class="table-contents" style="text-align: center;">
                                <a target="_blank" style="color: inherit; text-decoration: none;" href="${emoteCDN}">
                                    <span title="${emotesRemoved[i].emote}">
                                        <img style="vertical-align: middle; margin-top: 4px; margin-bottom: 4px;" loading="lazy" src="${
                                          emotesRemoved[i].url
                                        }" alt="${emoteName.trimmer()}">
                                    </span>
                                </a>
                            </div>`,
            type: `<div class="table-contents" style="text-align: center;">${emotesRemoved[i].type}</div>`,
            removed: `<div class="table-contents" style="text-align: center;">${formatDate(
              emotesRemoved[i].date
            )}</div>`,
          });
        }
      }
    }

    if (req.query.search) {
      const emoteCount = await kb.query(
        `
            SELECT COUNT(*) as count, type
            FROM emotes
            WHERE CHANNEL=?
            GROUP BY type`,
        [req.query.search.toLowerCase()]
      );

      const emoteCountBttv = !emoteCount.find(i => i.type === 'bttv')
        ? 0
        : emoteCount.find(i => i.type === 'bttv').count;
      const emoteCountFfz = !emoteCount.find(i => i.type === 'ffz')
        ? 0
        : emoteCount.find(i => i.type === 'ffz').count;
      const emoteCount7Tv = !emoteCount.find(i => i.type === '7tv')
        ? 0
        : emoteCount.find(i => i.type === '7tv').count;

      let html = fs.readFileSync('../kbot-website/html/express_pages/emotesDataTables.html');

      html = html.toString();

      const page = new utils.Swapper(html, [
        {
          search: req.query.search.toLowerCase(),
          search2: req.query.search.toLowerCase(),
          emoteCountBttv: emoteCountBttv,
          emoteCountFfz: emoteCountFfz,
          emoteCount7Tv: emoteCount7Tv,
          query:
            (
              await kb.query(
                `SELECT emotesUpdate FROM channels_logger WHERE channel="${req.query.search.toLowerCase()}"`
              )
            )[0]?.emotesUpdate ?? new Date(),
          emotesAdded: new Table({ class: 'table-context', id: 'added-emotes-table' })
            .setHeaders(headers)
            .setData(tableData)
            .render(),
          emotesRemoved: new Table({ class: 'table-context', id: 'removed-emotes-table' })
            .setHeaders(headersRemoved)
            .setData(tableDataRemoved)
            .render(),
        },
      ]);

      res.send(page.template());
    }
  });

  // kunszg.com/api/stats
  app.get('/stats', async (req, res) => {
    const modules = await kb.query(`SELECT * FROM stats`);

    const getModuleData = input => {
      const moduleData = modules.filter(i => i.type === 'module' && i.sha === input);
      return Date.parse(moduleData[0].date);
    };

    const executions = await kb.query(
      'SELECT count FROM stats WHERE type="statsApi" AND sha="commandExecs"'
    );
    const usersLogged = await kb.query(
      'SELECT count FROM stats WHERE type="statsApi" AND sha="totalUsers"'
    );
    const channels = await kb.query('SELECT * FROM channels');

    let totalViewCount = channels
      .filter(i => Number(i.viewerCount) > 0)
      .map(i => Number(i.viewerCount));
    totalViewCount = totalViewCount.reduce(function (x, y) {
      return x + y;
    }, 0);

    const commits = shell.execSync('sudo git rev-list --count master');
    const lines = shell.execSync(
      `find . -name '*.js' -not -path "./node_modules*" | xargs wc -l | tail -1`
    );

    const uptimeData = fs.readFileSync('./data/temp_api_uptime.txt').toString();
    const uptime = Date.now() - Math.trunc(Number(uptimeData) * 1000);

    const restartData = fs.readFileSync('./data/temp_api_restarting.txt').toString();
    const isRestarting =
      0.9 * channels.length > Math.trunc((Date.now() - Number(restartData)) / 1000);

    res.send({
      modules: {
        remindersLastSeen: getModuleData('reminders'),
        loggerLastSeen: getModuleData('logger'),
        apiLastSeen: getModuleData('api'),
        botLastSeen: getModuleData('bot'),
      },
      bot: {
        isRestarting: isRestarting,
        codeUptime: uptime,
        linesOfCode: Number(lines.toString().split(' ')[1]),
        usersLogged: Number(usersLogged[0].count),
        commandExecutions: Number(executions[0].count),
      },
      github: {
        commits: Number(commits),
      },
      twitch: {
        totalViewCount: totalViewCount,
      },
    });
  });

  app.listen(process.env.PORT || 8080, '0.0.0.0');
})();

const statusCheck = async () => {
  await kb.query(
    `
		UPDATE stats
		SET date=?
		WHERE type="module" AND sha="api"`,
    [new Date().toISOString().slice(0, 19).replace('T', ' ')]
  );
};
statusCheck();
setInterval(() => {
  statusCheck();
}, 60000);
