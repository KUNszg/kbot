const _ = require('lodash');
const modifyOutput = require('./modifyOutput');
const formatDate = require('./formatDate');

const prepareEmotesRow = (emotes, emoteState) => {
  const tableData = [];

  _.forEach(emotes, (emote, id) => {
    const {
      emote: emoteText,
      type: emoteType,
      url: emoteUrl,
      date: emoteDate,
      emoteId,
      sevenTvId,
    } = emote;

    const emoteName = modifyOutput(emoteText, 20);

    let emoteCDN = '#';

    if (_.get(emote, 'url')) {
      if (emoteType === 'bttv') {
        emoteCDN = emoteUrl
          .replace('https://cdn.betterttv.net/emote/', 'https://betterttv.com/emotes/')
          .replace('/1x', '');
      }
      if (emoteType === 'ffz') {
        emoteCDN = `https://www.frankerfacez.com/emoticon/${emoteId}-${emoteText}`;
      }
      if (emoteType === '7tv') {
        emoteCDN = `https://7tv.app/emotes/${sevenTvId}`;
      }
    }

    const inline = `class="table-contents" style="text-align: center;"`;
    const emoteClickableName = `<a target="_blank" style="color: inherit; text-decoration: none;" href="${emoteCDN}">${emoteName}</a>`;
    const emoteClickablePicture = `<a target="_blank" style="color: inherit; text-decoration: none;" href="${emoteCDN}">
          <span title="${emoteText}">
            <img style="vertical-align: middle; margin-top: 4px; margin-bottom: 4px;" loading="lazy" src="${emoteUrl}" alt="${emoteName}">
          </span></a>`;

    if (emoteState === "removed") {
      tableData.push({
        ID: `<div ${inline}>${id + 1}</div>`,
        name: `<div ${inline}>${emoteClickableName}</div>`,
        emote: `<div ${inline}>${emoteClickablePicture}</div>`,
        type: `<div ${inline}>${emoteType}</div>`,
        removed: `<div ${inline}>${formatDate(emoteDate)}</div>`,
      });
    }
    else {
      tableData.push({
        ID: `<div ${inline}>${id + 1}</div>`,
        name: `<div ${inline}>${emoteClickableName}</div>`,
        emote: `<div ${inline}>${emoteClickablePicture}</div>`,
        type: `<div ${inline}>${emoteType}</div>`,
        added: `<div ${inline}>${formatDate(emoteDate)}</div>`,
      });
    }
  });

  return tableData;
}

module.exports = prepareEmotesRow;