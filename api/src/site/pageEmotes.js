const fs = require('fs');
const Table = require('table-builder');
const _ = require('lodash');

const utils = require('../../../lib/utils/utils');

const consts = require('../consts/consts.json');

const prepareEmotesRow = require('../../utils/prepareEmotesRow');
const getAllPlatformsEmoteCount = require('../../utils/getAllPlatformsEmoteCount');


const pageEmotes = services => {
  const { app, kb } = services;

  app.get('/emotes', async (req, res) => {
    const tableData = [];
    const tableDataRemoved = [];

    const homepage = _.toString(
      fs.readFileSync('../../kbot-website/html/express_pages/emotes.html')
    );

    const search = _.toLower(_.get(req, 'query.search'));

    if (!search) {
      res.send(homepage);
      return;
    }

    const headers = consts.emoteHeaders;
    const headersRemoved = consts.emoteHeadersRemoved;

    const emotesAdded = await kb.sqlClient.query(
      `
            SELECT *
            FROM emotes
            WHERE channel=?
            ORDER BY date
            DESC`,
      [search]
    );

    const emotesRemoved = await kb.sqlClient.query(
      `
            SELECT *
            FROM emotes_removed
            WHERE channel=?
            ORDER BY date
            DESC`,
      [search]
    );

    if (!emotesAdded.length) {
      res.send(homepage);
      return;
    } else {
      const preparedRows = prepareEmotesRow(emotesAdded, "added");

      _.forEach(preparedRows, row => {
        tableData.push(row);
      });
    }

    if (!emotesRemoved.length) {
      tableDataRemoved.push(consts.emoteHeadersEmptyResponse);
    } else {
      const preparedRows = prepareEmotesRow(emotesRemoved, "removed");

      _.forEach(preparedRows, row => {
        tableDataRemoved.push(row);
      });
    }

    let html = fs.readFileSync('../../kbot-website/html/express_pages/emotesDataTables.html');
    html = html.toString();

    let emotesUpdate = await kb.query(
      `SELECT emotesUpdate FROM channels_logger WHERE channel=?`,
      [search]
    );
    emotesUpdate = _.get(_.first(emotesUpdate), "emotesUpdate");

    const emotesAddedHTMLTable = new Table({
      class: 'table-context',
      id: 'added-emotes-table',
    })
      .setHeaders(headers)
      .setData(tableData)
      .render();

    const emotesRemovedHTMLTable = new Table({
      class: 'table-context',
      id: 'removed-emotes-table',
    })
      .setHeaders(headersRemoved)
      .setData(tableDataRemoved)
      .render();

    const page = new utils.Swapper(html, [
      {
        search,
        search2: search,
        emoteCountBttv: getAllPlatformsEmoteCount(emotesAdded, 'bttv'),
        emoteCountFfz: getAllPlatformsEmoteCount(emotesAdded, 'ffz'),
        emoteCount7Tv: getAllPlatformsEmoteCount(emotesAdded, '7tv'),
        query: emotesUpdate,
        emotesAdded: emotesAddedHTMLTable,
        emotesRemoved: emotesRemovedHTMLTable,
      },
    ]);

    res.send(page.template());
  });
};

module.exports = pageEmotes;
