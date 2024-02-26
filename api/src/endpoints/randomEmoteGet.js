const randomEmoteGet = services => {
  const { app, kb } = services;

  app.get('/randomemote', async (req, res) => {
    const randomemote = await kb.sqlClient.query(`
        SELECT *
        FROM emotes
        ORDER BY RAND()
        LIMIT 3`);

    res.send([
      { emote: randomemote[0].emote, emoteUrl: randomemote[0].url },
      { emote: randomemote[1].emote, emoteUrl: randomemote[1].url },
      { emote: randomemote[2].emote, emoteUrl: randomemote[2].url },
    ]);
  });
};

module.exports = randomEmoteGet;
