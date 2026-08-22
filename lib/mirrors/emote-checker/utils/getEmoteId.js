const getEmoteId = (emoteId, emoteType) => {
  switch (emoteType) {
    case 'bttv':
      return { emoteId: null, sevenTvId: null };
    case '7tv':
      return { emoteId: null, sevenTvId: emoteId };
    case 'ffz':
      return { emoteId, sevenTvId: null };
  }
};

module.exports = getEmoteId;
